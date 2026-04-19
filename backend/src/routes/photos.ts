import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const uploadSchema = z.object({
  journeyId: z.number().optional(),
  caption: z.string().optional(),
});

export default async function photosRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    return reply.send({ message: 'List photos' });
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ message: 'Get photo', id });
  });

  fastify.post('/', async (request, reply) => {
    return reply.status(201).send({ message: 'Photo uploaded' });
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ message: 'Delete photo', id });
  });
}
