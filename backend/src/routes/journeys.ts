import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createJourneySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  routeId: z.number().optional(),
  status: z.enum(['planning', 'active', 'completed']).default('planning'),
});

export default async function journeysRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    return reply.send({ message: 'List journeys' });
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ message: 'Get journey', id });
  });

  fastify.post('/', async (request, reply) => {
    const body = createJourneySchema.parse(request.body);
    return reply.status(201).send({ message: 'Journey created', title: body.title });
  });

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ message: 'Update journey', id });
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ message: 'Delete journey', id });
  });

  fastify.post('/:id/photos', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.status(201).send({ message: 'Add photo to journey', journeyId: id });
  });
}
