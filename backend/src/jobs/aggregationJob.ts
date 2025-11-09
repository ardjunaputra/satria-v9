import { Job } from 'bull';
import { aggregationQueue } from '../config/queue';
import aggregatorService from '../services/aggregation/aggregatorService';
import { SystemStatus } from '../models';
import { logger } from '../utils/logger';
import { AggregationJobData } from '../types';
import { AGGREGATION_CONFIG } from '../config/constants';
import { io } from '../server';

class AggregationJob {
  // Process aggregation job
  async processJob(job: Job<AggregationJobData>): Promise<any> {
    logger.info(`Processing aggregation job ${job.id}`, job.data);

    try {
      // Emit status to connected clients
      io.emit('aggregation-status', {
        status: 'started',
        progress: 0,
        articles_collected: 0,
      });

      // Run aggregation cycle
      const result = await aggregatorService.runAggregationCycle();

      // Emit completion status
      io.emit('aggregation-status', {
        status: 'completed',
        progress: 100,
        articles_collected: result.articles_collected,
      });

      // Determine next cycle time based on results
      const nextCycleMinutes = await aggregatorService.determineNextCycleTime(
        result.articles_collected,
        result.processing_time
      );

      // Update system status with next refresh time
      await SystemStatus.update(
        {
          next_refresh_time: new Date(Date.now() + nextCycleMinutes * 60 * 1000),
        },
        { where: { id: 1 } }
      );

      // Schedule next job
      await this.scheduleNextJob(nextCycleMinutes);

      logger.info(`Next aggregation cycle in ${nextCycleMinutes} minutes`);

      return result;
    } catch (error: any) {
      logger.error('Aggregation job failed:', error);

      // Emit error status
      io.emit('aggregation-status', {
        status: 'error',
        error: error.message,
      });

      // Schedule retry with base interval
      await this.scheduleNextJob(AGGREGATION_CONFIG.BASE_INTERVAL);

      throw error;
    }
  }

  // Schedule next aggregation job
  async scheduleNextJob(delayMinutes: number): Promise<void> {
    const delay = delayMinutes * 60 * 1000; // Convert to milliseconds

    await aggregationQueue.add(
      {
        triggered_by: 'schedule',
      },
      {
        delay,
        jobId: `aggregation-${Date.now()}`,
      }
    );

    logger.info(`Scheduled next aggregation job in ${delayMinutes} minutes`);
  }

  // Start recurring aggregation jobs
  async start(): Promise<void> {
    logger.info('🚀 Starting aggregation job scheduler');

    // Process jobs
    aggregationQueue.process(async (job) => {
      return await this.processJob(job);
    });

    // Schedule first job immediately
    await aggregationQueue.add(
      {
        triggered_by: 'schedule',
      },
      {
        jobId: `aggregation-initial-${Date.now()}`,
      }
    );

    logger.info('✅ Aggregation job scheduler started');
  }

  // Manually trigger aggregation (for admin)
  async triggerManual(userId: string): Promise<void> {
    await aggregationQueue.add(
      {
        triggered_by: 'manual',
        triggered_by_user: userId,
      },
      {
        priority: 1, // High priority
        jobId: `aggregation-manual-${Date.now()}`,
      }
    );

    logger.info(`Manual aggregation triggered by user ${userId}`);
  }

  // Get queue stats
  async getStats(): Promise<any> {
    const [waiting, active, completed, failed] = await Promise.all([
      aggregationQueue.getWaitingCount(),
      aggregationQueue.getActiveCount(),
      aggregationQueue.getCompletedCount(),
      aggregationQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  // Clear completed jobs
  async clearCompleted(): Promise<void> {
    await aggregationQueue.clean(0, 'completed');
    logger.info('Cleared completed aggregation jobs');
  }
}

export default new AggregationJob();
