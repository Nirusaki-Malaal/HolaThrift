import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { cacheSession, getCachedSession, deleteCachedSession, acquireLock, releaseLock } from '../services/redis';

const router = Router();

const getSessionUser = async (req: Request): Promise<any | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return await getCachedSession(`session:${token}`);
};

router.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { items, total, transactionId } = req.body;
    if (!items || !total || !transactionId) {
      res.status(400).json({ error: 'Missing order details' });
      return;
    }

    const lockedIds: string[] = [];
    const soldIds: string[] = [];

    for (const item of items) {
      const lockKey = `lock:product:${item.productId}`;
      const locked = await acquireLock(lockKey, 5);
      if (!locked) {
        for (const id of soldIds) await Product.findByIdAndUpdate(id, { status: 'available' });
        for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
        res.status(409).json({ error: `"${item.name}" is being purchased by another buyer. Try again.` });
        return;
      }
      lockedIds.push(item.productId);

      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, status: 'available' },
        { status: 'sold' },
        { new: true }
      );
      if (!updated) {
        for (const id of soldIds) await Product.findByIdAndUpdate(id, { status: 'available' });
        for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
        res.status(409).json({ error: `"${item.name}" has already been sold. Remove it from your bag.` });
        return;
      }
      soldIds.push(item.productId);
    }

    for (const id of lockedIds) await releaseLock(`lock:product:${id}`);

    const order = new Order({
      userEmail: user.email,
      items,
      total: Number(total),
      transactionId,
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
