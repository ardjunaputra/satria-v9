import express, { Application } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import searchRoutes from './routes/searches';
import alertRoutes from './routes/alerts';
import adminRoutes from './routes/admin';
import userRoutes from './routes/users';

// Import WebSocket handler
import setupWebSocketHandlers from './websocket/socketHandler';

// Import jobs
import aggregationJob from './jobs/aggregationJob';
import cleanupJob from './jobs/cleanupJob';
import healthCheckJob from './jobs/healthCheckJob';

// Initialize Express app
const app: Application = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SATRIA Intelligence System is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/searches', searchRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Setup WebSocket handlers
setupWebSocketHandlers(io);

// Export io for use in other services
export { io };

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Start job schedulers
    logger.info('🔧 Initializing job schedulers...');
    await aggregationJob.start();
    await cleanupJob.start();
    await healthCheckJob.start();
    logger.info('✅ All job schedulers started');

    // Start listening
    server.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ███████╗ █████╗ ████████╗██████╗ ██╗ █████╗               ║
║   ██╔════╝██╔══██╗╚══██╔══╝██╔══██╗██║██╔══██╗              ║
║   ███████╗███████║   ██║   ██████╔╝██║███████║              ║
║   ╚════██║██╔══██║   ██║   ██╔══██╗██║██╔══██║              ║
║   ███████║██║  ██║   ██║   ██║  ██║██║██║  ██║              ║
║   ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝              ║
║                                                              ║
║   Situational Awareness, Threats Responses,                 ║
║   Intelligence and Analysis                                 ║
║                                                              ║
║   Malaysian Army Intelligence Service                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📡 WebSocket server initialized
⏰ Article age limit: 24 hours maximum
📊 Database: Connected
🔴 Redis: Connected
🔧 Job Schedulers: Active
   - Aggregation (30-min adaptive cycle)
   - Cleanup (daily at 2 AM)
   - Health Check (hourly)

✅ All systems operational - Ready to serve intelligence operations.
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
