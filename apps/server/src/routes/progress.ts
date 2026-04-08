import type { FastifyInstance } from 'fastify';
import { requireAuth, getUserId } from '../middleware/auth';
import { MissionService } from '../services/mission';

const missions = new MissionService();

export async function progressRoutes(app: FastifyInstance) {
  app.get('/progress', { preHandler: [requireAuth] }, async (request) => {
    const userId = getUserId(request);
    return missions.listPlayerProgress(userId);
  });
}
