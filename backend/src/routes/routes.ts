import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { routes } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function routesRoutes(fastify: FastifyInstance) {
  // List all border routes
  fastify.get('/', async () => {
    const all = await db.select().from(routes);
    return all;
  });

  // Get route by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const route = await db
      .select()
      .from(routes)
      .where(eq(routes.id, parseInt(id)))
      .get();

    if (!route) {
      return reply.status(404).send({ error: 'Route not found' });
    }
    return route;
  });

  // Get route by number (G219, G331, G228)
  fastify.get('/by-number/:routeNumber', async (request, reply) => {
    const { routeNumber } = request.params as { routeNumber: string };
    const route = await db
      .select()
      .from(routes)
      .where(eq(routes.routeNumber, routeNumber))
      .get();

    if (!route) {
      return reply.status(404).send({ error: 'Route not found' });
    }
    return route;
  });
}
