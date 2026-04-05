import type { FastifyRequest } from 'fastify';

export class AuthService {
  async verifyToken(request: FastifyRequest): Promise<string | null> {
    // TODO: verify Supabase JWT, return user ID
    return null;
  }
}
