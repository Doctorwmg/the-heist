import type { FastifyInstance } from 'fastify';

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get('/leaderboard', async () => {
    // TODO: fetch from materialised view
    return [];
  });
}
