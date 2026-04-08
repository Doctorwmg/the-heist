import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth';

const authService = new AuthService();

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId = await authService.verifyToken(request);
  if (!userId) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  // Attach userId to request for downstream handlers
  (request as FastifyRequest & { userId: string }).userId = userId;
}

export function getUserId(request: FastifyRequest): string {
  return (request as FastifyRequest & { userId: string }).userId;
}
