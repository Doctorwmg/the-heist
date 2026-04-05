import type { FastifyInstance } from 'fastify';

export async function progressRoutes(app: FastifyInstance) {
  app.get('/progress', async () => {
    // TODO: fetch player progress from Supabase
    return [];
  });
}
