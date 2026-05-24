import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redisClient = createClient({
  url: redisUrl
});

redisClient.on('error', (err) => {
  console.error(err);
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error(error);
  }
};

export const cacheSession = async (key: string, value: any, ttlSeconds: number = 86400): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    }
  } catch (error) {
    console.error(error);
  }
};

export const getCachedSession = async (key: string): Promise<any | null> => {
  try {
    if (redisClient.isOpen) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error(error);
  }
  return null;
};

export const deleteCachedSession = async (key: string): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.del(key);
    }
  } catch (error) {
    console.error(error);
  }
};

export const acquireLock = async (key: string, ttlSeconds: number = 5): Promise<boolean> => {
  try {
    if (redisClient.isOpen) {
      const result = await redisClient.set(key, '1', { NX: true, EX: ttlSeconds });
      return result === 'OK';
    }
  } catch (error) {
    console.error(error);
  }
  return false;
};

export const releaseLock = async (key: string): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.del(key);
    }
  } catch (error) {
    console.error(error);
  }
};
