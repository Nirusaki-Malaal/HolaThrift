import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getCashfreeMode, isCashfreeConfigured } from '../services/cashfree';
import { redisClient } from '../services/redis';
import { isShiprocketConfigured } from '../services/shiprocket';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  const mongoConnected = mongoose.connection.readyState === 1;
  const redisConnected = redisClient.isOpen;
  const status = mongoConnected && redisConnected ? 'ok' : 'degraded';

  res.status(status === 'ok' ? 200 : 503).json({
    status,
    services: {
      mongo: mongoConnected,
      redis: redisConnected,
      cashfree: isCashfreeConfigured(),
      cashfreeMode: getCashfreeMode(),
      shiprocket: isShiprocketConfigured(),
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
