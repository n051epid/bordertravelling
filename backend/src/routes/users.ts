import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function usersRoutes(fastify: FastifyInstance) {
  // Get user public profile
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await db
      .select({ id: users.id, username: users.username, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .get();

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return user;
  });

  // Update current user profile
  fastify.patch('/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { username } = request.body as { username?: string };

    if (!username) {
      return reply.status(400).send({ error: 'Username is required' });
    }

    const result = await db
      .update(users)
      .set({ username })
      .where(eq(users.id, request.user.id))
      .returning({ id: users.id, username: users.username })
      .get();

    return result;
  });
}
