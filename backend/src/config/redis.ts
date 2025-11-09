import { createClient } from 'redis';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

export const redisClient = createClient({
  url: REDIS_URL,
  password: REDIS_PASSWORD,
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Unable to connect to Redis:', error);
    process.exit(1);
  }
};
