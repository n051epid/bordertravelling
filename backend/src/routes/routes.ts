import { FastifyInstance } from 'fastify';

export default async function routesRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    return reply.send({ message: 'List routes' });
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ message: 'Get route', id });
  });

  fastify.get('/by-number/:routeNumber', async (request, reply) => {
    const { routeNumber } = request.params as { routeNumber: string };
    return reply.send({ message: 'Get route by number', routeNumber });
  });
}
