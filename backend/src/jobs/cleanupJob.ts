import { Job } from 'bull';
import { cleanupQueue } from '../config/queue';
import { Article, SystemStatus } from '../models';
import { logger } from '../utils/logger';
import { CleanupJobData } from '../types';
import { DATA_RETENTION_DAYS } from '../config/constants';
import { Op } from 'sequelize';

class CleanupJob {
  // Process cleanup job
  async processJob(job: Job<CleanupJobData>): Promise<any> {
    logger.info(`Processing cleanup job ${job.id}`);

    try {
      const retentionDays = job.data.retention_days || DATA_RETENTION_DAYS;
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Delete old articles
      const deleteResult = await Article.destroy({
        where: {
          published_at: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      logger.info(`Deleted ${deleteResult} articles older than ${retentionDays} days`);

      // Reset daily article count at midnight
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        await SystemStatus.update(
          { articles_collected_today: 0 },
          { where: { id: 1 } }
        );
        logger.info('Reset daily article count');
      }

      return { deleted: deleteResult };
    } catch (error: any) {
      logger.error('Cleanup job failed:', error);
      throw error;
    }
  }

  // Start recurring cleanup job (daily at 2 AM)
  async start(): Promise<void> {
    logger.info('🧹 Starting cleanup job scheduler');

    // Process jobs
    cleanupQueue.process(async (job) => {
      return await this.processJob(job);
    });

    // Schedule daily cleanup at 2 AM
    const schedule = '0 2 * * *'; // Cron expression for 2 AM daily

    await cleanupQueue.add(
      { retention_days: DATA_RETENTION_DAYS },
      {
        repeat: {
          cron: schedule,
        },
        jobId: 'cleanup-daily',
      }
    );

    logger.info('✅ Cleanup job scheduled for 2 AM daily');
  }

  // Manual cleanup trigger
  async triggerManual(retentionDays?: number): Promise<void> {
    await cleanupQueue.add(
      { retention_days: retentionDays || DATA_RETENTION_DAYS },
      {
        jobId: `cleanup-manual-${Date.now()}`,
      }
    );

    logger.info('Manual cleanup job triggered');
  }
}

export default new CleanupJob();
