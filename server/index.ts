import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import { connectRedis } from './services/redis';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/holathrift';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();
export default app;
