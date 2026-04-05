import type { FastifyInstance } from 'fastify';

export async function missionRoutes(app: FastifyInstance) {
  app.get('/missions', async () => {
    // TODO: fetch missions from Supabase
    return [];
  });

  app.post<{ Params: { slug: string } }>('/missions/:slug/start', async (request) => {
    const { slug } = request.params;
    // TODO: create container, start mission
    return { slug, status: 'started' };
  });

  app.post<{ Params: { slug: string } }>('/missions/:slug/submit', async (request) => {
    const { slug } = request.params;
    // TODO: run validation against container
    return { slug, status: 'submitted' };
  });
}
