import { FastifyInstance } from 'fastify';

export default async function usersRoutes(fastify: FastifyInstance) {
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ message: 'Get user by id', id });
  });

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ message: 'Update user', id });
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ message: 'Delete user', id });
  });
}
