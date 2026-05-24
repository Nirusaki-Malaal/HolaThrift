import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import { cacheSession, getCachedSession, deleteCachedSession } from '../services/redis';

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
    const order = new Order({
      userEmail: user.email,
      items,
      total: Number(total),
      transactionId,
    });
    await order.save();
    await deleteCachedSession(`orders:${user.email}`);
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
