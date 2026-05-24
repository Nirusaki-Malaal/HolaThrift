import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import userRoutes from './routes/user';
import { connectRedis } from './services/redis';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/holathrift').replace(/"/g, '');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/user', userRoutes);

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
