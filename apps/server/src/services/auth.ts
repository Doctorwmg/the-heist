import { createClient } from '@supabase/supabase-js';
import type { FastifyRequest } from 'fastify';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

export class AuthService {
  async verifyToken(request: FastifyRequest): Promise<string | null> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    return this.verifyJwt(token);
  }

  async verifyJwt(token: string): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  }
}
