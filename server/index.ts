import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import userRoutes from './routes/user';
import healthRoutes from './routes/health';
import { connectRedis } from './services/redis';
import { getEnv } from './config/env';
import { apiNotFoundHandler } from './middleware/notFound';
import { apiErrorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/holathrift').replace(/"/g, '');
const allowedOrigins = new Set(
  (getEnv('CLIENT_ORIGINS') || 'https://holathrift.in,https://www.holathrift.in,http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const bodyLimit = getEnv('REQUEST_BODY_LIMIT') || '8mb';

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ limit: bodyLimit, extended: true }));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}), authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/user', userRoutes);
app.use('/api', apiNotFoundHandler);
app.use('/api', apiErrorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
    });
    
  connectRedis()
    .then(() => {
      console.log('Connected to Redis');
    })
    .catch((err) => {
      console.error('Redis connection failed:', err.message);
    });
});

export default app;
