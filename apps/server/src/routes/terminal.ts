import type { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth';
import { ExecutionService } from '../services/execution';
import { WebSocketService } from '../services/websocket';

const auth = new AuthService();
const execution = new ExecutionService();
const wsService = new WebSocketService();

export async function terminalRoutes(app: FastifyInstance) {
  app.get<{ Params: { containerId: string }; Querystring: { token?: string; cols?: string; rows?: string } }>(
    '/ws/terminal/:containerId',
    { websocket: true },
    async (socket, request) => {
      const { containerId } = request.params;
      const token = request.query.token;

      // Authenticate via JWT token in query parameter
      if (!token) {
        socket.close(4001, 'Missing auth token');
        return;
      }

      const userId = await auth.verifyJwt(token);
      if (!userId) {
        socket.close(4001, 'Invalid auth token');
        return;
      }

      // Verify the user owns this container
      const containers = await execution.listPlayerContainers(userId);
      if (!containers.some((c) => c.id === containerId)) {
        socket.close(4003, 'Not your container');
        return;
      }

      // Verify container is running
      const status = await execution.getContainerStatus(containerId);
      if (status !== 'running') {
        socket.close(4004, 'Container not running');
        return;
      }

      const cols = parseInt(request.query.cols || '80', 10);
      const rows = parseInt(request.query.rows || '24', 10);

      try {
        await wsService.bridgeTerminal(socket, containerId, { cols, rows });
      } catch (err) {
        app.log.error(err, 'Failed to bridge terminal');
        socket.close(4500, 'Terminal bridge failed');
      }
    },
  );
}
