import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { MissionService } from '../services/mission';

const missions = new MissionService();

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get('/leaderboard', { preHandler: [requireAuth] }, async () => {
    return missions.getLeaderboard();
  });
}
