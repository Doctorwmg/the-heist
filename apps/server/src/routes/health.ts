import type { FastifyInstance } from 'fastify';
import { ExecutionService } from '../services/execution';

const execution = new ExecutionService();

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    const dockerConnected = await execution.checkConnection();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      docker: dockerConnected ? 'connected' : 'unavailable',
    };
  });
}
