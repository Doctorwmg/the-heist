import type { FastifyInstance } from 'fastify';
import { requireAuth, getUserId } from '../middleware/auth';
import { ExecutionService } from '../services/execution';

const execution = new ExecutionService();

export async function containerRoutes(app: FastifyInstance) {
  // Directory listing
  app.get<{ Params: { containerId: string }; Querystring: { path?: string } }>(
    '/containers/:containerId/fs',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { containerId } = request.params;
      const dirPath = request.query.path || '/home/operative/workspace';

      // Verify the user owns this container
      const userId = getUserId(request);
      const containers = await execution.listPlayerContainers(userId);
      if (!containers.some((c) => c.id === containerId)) {
        reply.code(403).send({ error: 'Not your container' });
        return;
      }

      const { stdout, exitCode } = await execution.execInContainer(containerId, [
        'ls',
        '-la',
        '--time-style=+%s',
        dirPath,
      ]);

      if (exitCode !== 0) {
        reply.code(400).send({ error: 'Failed to list directory' });
        return;
      }

      const lines = stdout.trim().split('\n').slice(1); // Skip "total" line
      const entries = lines
        .map((line) => {
          const parts = line.split(/\s+/);
          if (parts.length < 7) return null;
          const permissions = parts[0];
          const size = parseInt(parts[4], 10);
          const name = parts.slice(6).join(' ');
          if (name === '.' || name === '..') return null;
          const type = permissions.startsWith('d') ? 'directory' : 'file';
          return { name, type, size, permissions };
        })
        .filter(Boolean);

      return { entries };
    },
  );

  // Read file
  app.get<{ Params: { containerId: string }; Querystring: { path: string } }>(
    '/containers/:containerId/files',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { containerId } = request.params;
      const filePath = request.query.path;

      if (!filePath) {
        reply.code(400).send({ error: 'path query parameter required' });
        return;
      }

      const userId = getUserId(request);
      const containers = await execution.listPlayerContainers(userId);
      if (!containers.some((c) => c.id === containerId)) {
        reply.code(403).send({ error: 'Not your container' });
        return;
      }

      const { stdout, exitCode } = await execution.execInContainer(containerId, [
        'cat',
        filePath,
      ]);

      if (exitCode !== 0) {
        reply.code(404).send({ error: 'File not found' });
        return;
      }

      return { path: filePath, content: stdout };
    },
  );

  // Write file
  app.put<{
    Params: { containerId: string };
    Body: { path: string; content: string };
  }>(
    '/containers/:containerId/files',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { containerId } = request.params;
      const { path: filePath, content } = request.body;

      if (!filePath || content === undefined) {
        reply.code(400).send({ error: 'path and content required' });
        return;
      }

      const userId = getUserId(request);
      const containers = await execution.listPlayerContainers(userId);
      if (!containers.some((c) => c.id === containerId)) {
        reply.code(403).send({ error: 'Not your container' });
        return;
      }

      // Write file using tee to handle content safely
      const { exitCode } = await execution.execInContainer(containerId, [
        'bash',
        '-c',
        `cat > ${JSON.stringify(filePath)} << 'HEIST_EOF'\n${content}\nHEIST_EOF`,
      ]);

      if (exitCode !== 0) {
        reply.code(500).send({ error: 'Failed to write file' });
        return;
      }

      return { path: filePath, written: true };
    },
  );
}
