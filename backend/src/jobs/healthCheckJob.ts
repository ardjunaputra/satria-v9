import { Job } from 'bull';
import { healthCheckQueue } from '../config/queue';
import { Source } from '../models';
import { logger } from '../utils/logger';
import axios from 'axios';

class HealthCheckJob {
  // Process health check job
  async processJob(job: Job): Promise<any> {
    logger.debug('Processing health check job');

    try {
      const sources = await Source.findAll({
        where: { is_active: true },
      });

      const results = [];

      for (const source of sources) {
        if (!source.url) continue;

        try {
          // Ping the source
          await axios.get(source.url, { timeout: 10000 });

          // Update status if it was offline
          if (source.status !== 'online') {
            source.status = 'online';
            source.error_count = 0;
            await source.save();
            logger.info(`Source ${source.name} is back online`);
          }

          results.push({ source: source.name, status: 'online' });
        } catch (error) {
          results.push({ source: source.name, status: 'offline' });

          // Don't update status on every health check failure
          // Let aggregation job handle status updates
        }
      }

      return { checked: results.length, results };
    } catch (error: any) {
      logger.error('Health check job failed:', error);
      throw error;
    }
  }

  // Start recurring health check (every hour)
  async start(): Promise<void> {
    logger.info('🏥 Starting health check job scheduler');

    // Process jobs
    healthCheckQueue.process(async (job) => {
      return await this.processJob(job);
    });

    // Schedule hourly health checks
    await healthCheckQueue.add(
      {},
      {
        repeat: {
          cron: '0 * * * *', // Every hour
        },
        jobId: 'health-check-hourly',
      }
    );

    logger.info('✅ Health check job scheduled hourly');
  }
}

export default new HealthCheckJob();
