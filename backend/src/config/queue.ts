import Queue from 'bull';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Bull queues
export const aggregationQueue = new Queue('aggregation', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

export const cleanupQueue = new Queue('cleanup', REDIS_URL);
export const healthCheckQueue = new Queue('health-check', REDIS_URL);

// Queue event listeners
aggregationQueue.on('completed', (job, result) => {
  logger.info(`Aggregation job ${job.id} completed`, result);
});

aggregationQueue.on('failed', (job, error) => {
  logger.error(`Aggregation job ${job?.id} failed:`, error);
});

aggregationQueue.on('error', (error) => {
  logger.error('Aggregation queue error:', error);
});

cleanupQueue.on('completed', (job) => {
  logger.info(`Cleanup job ${job.id} completed`);
});

healthCheckQueue.on('completed', (job) => {
  logger.debug(`Health check job ${job.id} completed`);
});

logger.info('✅ Bull queues initialized');

export default {
  aggregationQueue,
  cleanupQueue,
  healthCheckQueue,
};
