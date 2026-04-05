import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { healthRoutes } from './routes/health';
import { missionRoutes } from './routes/missions';
import { progressRoutes } from './routes/progress';
import { leaderboardRoutes } from './routes/leaderboard';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(websocket);

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(missionRoutes, { prefix: '/api' });
  await app.register(progressRoutes, { prefix: '/api' });
  await app.register(leaderboardRoutes, { prefix: '/api' });

  await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
