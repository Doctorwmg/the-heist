import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health';
import { missionRoutes } from './routes/missions';
import { progressRoutes } from './routes/progress';
import { leaderboardRoutes } from './routes/leaderboard';
import { containerRoutes } from './routes/containers';
import { terminalRoutes } from './routes/terminal';
import { ExecutionService } from './services/execution';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await app.register(websocket);

  // Routes
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(missionRoutes, { prefix: '/api' });
  await app.register(progressRoutes, { prefix: '/api' });
  await app.register(leaderboardRoutes, { prefix: '/api' });
  await app.register(containerRoutes, { prefix: '/api' });
  await app.register(terminalRoutes);

  // Check Docker connection on startup
  const execution = new ExecutionService();
  const dockerOk = await execution.checkConnection();
  if (dockerOk) {
    app.log.info('Docker connected');
  } else {
    app.log.warn('Docker not available — container features will fail');
  }

  // Cleanup expired containers every 15 minutes
  const cleanupTimer = setInterval(async () => {
    try {
      const cleaned = await execution.cleanupExpiredContainers();
      if (cleaned > 0) {
        app.log.info(`Cleaned up ${cleaned} expired containers`);
      }
    } catch (err) {
      app.log.error(err, 'Container cleanup failed');
    }
  }, CLEANUP_INTERVAL_MS);

  // Clean up timer on shutdown
  app.addHook('onClose', () => {
    clearInterval(cleanupTimer);
  });

  await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
