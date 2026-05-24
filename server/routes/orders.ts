import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { cacheSession, getCachedSession, deleteCachedSession, acquireLock, releaseLock, redisClient } from '../services/redis';
import { createCashfreeOrder, getCashfreeMode, isCashfreeConfigured, verifyCashfreePayment } from '../services/cashfree';
import { checkServiceability, createShiprocketOrder, trackAwb, trackShipment } from '../services/shiprocket';
import { isIntegrationConfigError } from '../services/integrationError';
import { getRequestSession } from '../utils/auth';
import type { UserSession } from '../utils/auth';

const router = Router();

const reservationTtlSeconds = 900;

interface IncomingOrderItem {
  productId: string;
  name?: string;
  quantity?: number;
}

interface VerifiedOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const getSessionUser = async (req: Request): Promise<UserSession | null> => getRequestSession(req);

const getReservationExpiry = (): string => {
  return new Date(Date.now() + reservationTtlSeconds * 1000).toISOString();
};

const getVerifiedItems = async (items: IncomingOrderItem[]): Promise<{ verifiedItems: VerifiedOrderItem[]; total: number }> => {
  const verifiedItems: VerifiedOrderItem[] = [];
  let total = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error(`"${item.name || 'Item'}" was not found.`);
    const quantity = Math.max(1, Number(item.quantity || 1));
    verifiedItems.push({
      productId: product._id.toString(),
      name: product.name,
      price: product.price,
      quantity,
    });
    total += product.price * quantity;
  }

  return { verifiedItems, total };
};

const getStringField = (value: Record<string, unknown> | null, key: string): string => {
  const field = value?.[key];
  return field ? String(field) : '';
};

const releaseReservedProducts = async (productIds: string[]): Promise<void> => {
  for (const productId of productIds) {
    await Product.findByIdAndUpdate(productId, { status: 'available' });
    if (redisClient.isOpen) {
      await redisClient.del(`reservation:product:${productId}`);
    }
  }
};

const sendErrorResponse = (res: Response, error: unknown): void => {
  if (isIntegrationConfigError(error)) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
};

router.post('/reserve', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
      res.status(400).json({ error: 'Missing reservation details' });
      return;
    }
    if (!isCashfreeConfigured()) {
      res.status(503).json({ error: 'Cashfree credentials are not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.' });
      return;
    }

    const { verifiedItems, total } = await getVerifiedItems(items);

    const lockedIds: string[] = [];
    const reservedIds: string[] = [];

    for (const item of verifiedItems) {
      const lockKey = `lock:product:${item.productId}`;
      const locked = await acquireLock(lockKey, 5);
      if (!locked) {
        await releaseReservedProducts(reservedIds);
        for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
        res.status(409).json({ error: `"${item.name}" is currently locked by another buyer. Please try again.` });
        return;
      }
      lockedIds.push(item.productId);

      const prod = await Product.findOne({ _id: item.productId, status: 'available' });
      if (!prod) {
        await releaseReservedProducts(reservedIds);
        for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
        res.status(409).json({ error: `"${item.name}" is no longer available.` });
        return;
      }
    }

    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.productId, { status: 'reserved' });
      reservedIds.push(item.productId);
      if (redisClient.isOpen) {
        await redisClient.setEx(`reservation:product:${item.productId}`, reservationTtlSeconds, '1');
      }
    }

    for (const id of lockedIds) {
      await releaseLock(`lock:product:${id}`);
    }

    const cashfreeOrderId = `HT_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    if (redisClient.isOpen) {
      await redisClient.setEx(
        `reservation:order:${cashfreeOrderId}`,
        reservationTtlSeconds,
        JSON.stringify(verifiedItems.map((it) => it.productId))
      );
    }

    let cfOrder: Awaited<ReturnType<typeof createCashfreeOrder>>;
    try {
      cfOrder = await createCashfreeOrder(
        cashfreeOrderId,
        Number(total),
        shippingAddress.email,
        shippingAddress.phone,
        shippingAddress.name
      );
    } catch (error) {
      await releaseReservedProducts(reservedIds);
      if (redisClient.isOpen) {
        await redisClient.del(`reservation:order:${cashfreeOrderId}`);
      }
      await deleteCachedSession('products:all');
      throw error;
    }

    await deleteCachedSession('products:all');

    res.status(200).json({
      paymentSessionId: cfOrder.payment_session_id,
      cashfreeOrderId,
      cashfreeMode: getCashfreeMode(),
      reservationExpiresAt: getReservationExpiry(),
      orderExpiresAt: cfOrder.order_expiry_time || '',
      amount: total,
      items: verifiedItems,
    });
  } catch (error) {
    if (!isIntegrationConfigError(error)) console.error(error);
    sendErrorResponse(res, error);
  }
});

router.get('/serviceability/:pincode', async (req: Request, res: Response): Promise<void> => {
  try {
    const pincode = String(req.params.pincode).replace(/\D/g, '');
    if (pincode.length !== 6) {
      res.status(400).json({ error: 'Valid 6-digit PIN code is required' });
      return;
    }

    const data = await checkServiceability(pincode);
    res.json(data);
  } catch (error) {
    if (isIntegrationConfigError(error)) {
      res.json({
        serviceable: true,
        courierName: 'Shiprocket',
        estimatedDays: '',
        freightCharge: 0,
        raw: null,
        message: error.message,
      });
      return;
    }
    console.error(error);
    res.status(502).json({ error: 'Delivery serviceability check failed' });
  }
});

router.post('/verify-payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { cashfreeOrderId, shippingAddress, items } = req.body;
    if (!cashfreeOrderId || !shippingAddress || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Missing payment details' });
      return;
    }

    const { verifiedItems, total } = await getVerifiedItems(items);

    const cfStatus = await verifyCashfreePayment(cashfreeOrderId);
    if (cfStatus.order_status !== 'PAID') {
      const pids: string[] = [];
      if (redisClient.isOpen) {
        const cachedPids = await redisClient.get(`reservation:order:${cashfreeOrderId}`);
        if (cachedPids) pids.push(...JSON.parse(cachedPids));
      }
      if (pids.length === 0) {
        pids.push(...verifiedItems.map((it) => it.productId));
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
    for (const item of verifiedItems) {
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

    let srOrder: Record<string, unknown> | null = null;
    try {
      srOrder = await createShiprocketOrder(cashfreeOrderId, Number(total), verifiedItems, shippingAddress);
    } catch (shippingError) {
      if (isIntegrationConfigError(shippingError)) {
        console.warn(shippingError.message);
      } else {
        console.error('Shiprocket order creation failed, proceeding to complete order:', shippingError);
      }
    }

    const order = new Order({
      userEmail: user.email,
      items: verifiedItems,
      total: Number(total),
      transactionId: cashfreeOrderId,
      shippingAddress: shippingAddress as ShippingAddress,
      cashfreeOrderId,
      paymentStatus: 'PAID',
      cashfreeOrderStatus: cfStatus.order_status || 'PAID',
      shiprocketOrderId: getStringField(srOrder, 'order_id'),
      shiprocketShipmentId: getStringField(srOrder, 'shipment_id'),
      awbCode: getStringField(srOrder, 'awb_code'),
      courierName: getStringField(srOrder, 'courier_name'),
      shippingStatus: srOrder ? 'Shipment Created' : 'Pending Shipment Creation',
    });

    await order.save();
    await deleteCachedSession(`orders:${user.email}`);
    await deleteCachedSession('products:all');

    res.status(201).json(order);
  } catch (error) {
    if (!isIntegrationConfigError(error)) console.error(error);
    sendErrorResponse(res, error);
  }
});

router.get('/track/:shipmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const order = await Order.findOne({
      userEmail: user.email,
      $or: [
        { shiprocketShipmentId: req.params.shipmentId },
        { awbCode: req.params.shipmentId },
      ],
    });

    if (!order) {
      res.status(404).json({ error: 'Shipment not found for this account' });
      return;
    }

    const data = order.awbCode && req.params.shipmentId === order.awbCode
      ? await trackAwb(order.awbCode)
      : await trackShipment(order.shiprocketShipmentId);

    order.awbCode = data.awbCode || order.awbCode;
    order.courierName = data.courierName || order.courierName;
    order.estimatedDelivery = data.estimatedDelivery || order.estimatedDelivery;
    order.lastTrackingStatus = data.currentStatus || order.lastTrackingStatus;
    order.lastTrackingSyncAt = new Date();
    order.shippingStatus = data.currentStatus || order.shippingStatus;
    await order.save();
    await deleteCachedSession(`orders:${user.email}`);

    res.json({ orderId: order._id, tracking: data });
  } catch (error) {
    if (!isIntegrationConfigError(error)) console.error(error);
    sendErrorResponse(res, error);
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
