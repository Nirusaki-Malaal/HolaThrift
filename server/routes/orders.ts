import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { cacheSession, getCachedSession, deleteCachedSession, acquireLock, releaseLock, redisClient } from '../services/redis';
import { createCashfreeOrder, verifyCashfreePayment } from '../services/cashfree';
import { createShiprocketOrder, trackShipment } from '../services/shiprocket';

const router = Router();

const getSessionUser = async (req: Request): Promise<any | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return await getCachedSession(`session:${token}`);
};

router.post('/reserve', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { items, total, shippingAddress } = req.body;
    if (!items || !total || !shippingAddress) {
      res.status(400).json({ error: 'Missing reservation details' });
      return;
    }

    const lockedIds: string[] = [];
    const reservedIds: string[] = [];

    for (const item of items) {
      const lockKey = `lock:product:${item.productId}`;
      const locked = await acquireLock(lockKey, 5);
      if (!locked) {
        for (const id of reservedIds) await Product.findByIdAndUpdate(id, { status: 'available' });
        for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
        res.status(409).json({ error: `"${item.name}" is currently locked by another buyer. Please try again.` });
        return;
      }
      lockedIds.push(item.productId);

      const prod = await Product.findOne({ _id: item.productId, status: 'available' });
      if (!prod) {
        for (const id of reservedIds) await Product.findByIdAndUpdate(id, { status: 'available' });
        for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
        res.status(409).json({ error: `"${item.name}" is no longer available.` });
        return;
      }
    }

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { status: 'reserved' });
      reservedIds.push(item.productId);
      if (redisClient.isOpen) {
        await redisClient.setEx(`reservation:product:${item.productId}`, 900, '1');
      }
    }

    for (const id of lockedIds) {
      await releaseLock(`lock:product:${id}`);
    }

    const cashfreeOrderId = `HT_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    if (redisClient.isOpen) {
      await redisClient.setEx(
        `reservation:order:${cashfreeOrderId}`,
        900,
        JSON.stringify(items.map((it: any) => it.productId))
      );
    }

    const cfOrder = await createCashfreeOrder(
      cashfreeOrderId,
      Number(total),
      shippingAddress.email,
      shippingAddress.phone,
      shippingAddress.name
    );

    await deleteCachedSession('products:all');

    res.status(200).json({
      paymentSessionId: cfOrder.payment_session_id,
      cashfreeOrderId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { cashfreeOrderId, shippingAddress, items, total } = req.body;
    if (!cashfreeOrderId || !shippingAddress || !items || !total) {
      res.status(400).json({ error: 'Missing payment details' });
      return;
    }

    const cfStatus = await verifyCashfreePayment(cashfreeOrderId);
    if (cfStatus.order_status !== 'PAID') {
      const pids: string[] = [];
      if (redisClient.isOpen) {
        const cachedPids = await redisClient.get(`reservation:order:${cashfreeOrderId}`);
        if (cachedPids) pids.push(...JSON.parse(cachedPids));
      }
      if (pids.length === 0) {
        pids.push(...items.map((it: any) => it.productId));
      }
      for (const pid of pids) {
        await Product.findByIdAndUpdate(pid, { status: 'available' });
        if (redisClient.isOpen) {
          await redisClient.del(`reservation:product:${pid}`);
        }
      }
      if (redisClient.isOpen) {
        await redisClient.del(`reservation:order:${cashfreeOrderId}`);
      }
      await deleteCachedSession('products:all');
      res.status(400).json({ error: 'Payment not successful. Product reservations released.' });
      return;
    }

    const lockedIds: string[] = [];
    for (const item of items) {
      const lockKey = `lock:product:${item.productId}`;
      await acquireLock(lockKey, 5);
      lockedIds.push(item.productId);
      await Product.findByIdAndUpdate(item.productId, { status: 'sold' });
      if (redisClient.isOpen) {
        await redisClient.del(`reservation:product:${item.productId}`);
      }
    }
    for (const id of lockedIds) {
      await releaseLock(`lock:product:${id}`);
    }
    if (redisClient.isOpen) {
      await redisClient.del(`reservation:order:${cashfreeOrderId}`);
    }

    let srOrder: any = null;
    try {
      srOrder = await createShiprocketOrder(cashfreeOrderId, Number(total), items, shippingAddress);
    } catch (shippingError) {
      console.error('Shiprocket order creation failed, proceeding to complete order:', shippingError);
    }

    const order = new Order({
      userEmail: user.email,
      items,
      total: Number(total),
      transactionId: cashfreeOrderId,
      shippingAddress,
      cashfreeOrderId,
      shiprocketOrderId: srOrder?.order_id?.toString() || '',
      shiprocketShipmentId: srOrder?.shipment_id?.toString() || '',
      awbCode: srOrder?.awb_code || '',
      shippingStatus: srOrder ? 'Created' : 'Pending Shipment Creation',
    });

    await order.save();
    await deleteCachedSession(`orders:${user.email}`);
    await deleteCachedSession('products:all');

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/track/:shipmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const data = await trackShipment(req.params.shipmentId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const cacheKey = `orders:${user.email}`;
    const cached = await getCachedSession(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }
    const orders = await Order.find({ userEmail: user.email }).sort({ createdAt: -1 });
    await cacheSession(cacheKey, orders, 86400);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
