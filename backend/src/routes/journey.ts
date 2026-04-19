import { FastifyPluginAsync } from 'fastify';
import { Pool } from 'pg';

interface JourneyParams {
  id: string;
}

interface CreateJourneyBody {
  route_type: 'G219' | 'G331' | 'G228';
  title: string;
}

const journeyRoutes: FastifyPluginAsync = async (fastify) => {
  // Add auth decorator to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Get all journeys for the user
  fastify.get('/', async (request, reply) => {
    const userId = (request.user as any).id;
    const pool = fastify.pg;

    const result = await pool.query(
      'SELECT id, route_type, title, created_at FROM journeys WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return reply.send(result.rows);
  });

  // Create a new journey
  fastify.post<{ Body: CreateJourneyBody }>('/', async (request, reply) => {
    const userId = (request.user as any).id;
    const { route_type, title } = request.body;

    if (!route_type || !title) {
      return reply.status(400).send({ error: 'route_type and title are required' });
    }

    if (!['G219', 'G331', 'G228'].includes(route_type)) {
      return reply.status(400).send({ error: 'route_type must be G219, G331, or G228' });
    }

    const pool = fastify.pg;

    const result = await pool.query(
      'INSERT INTO journeys (user_id, route_type, title) VALUES ($1, $2, $3) RETURNING id, route_type, title, created_at',
      [userId, route_type, title]
    );

    return reply.status(201).send(result.rows[0]);
  });

  // Get journey details with verified photos
  fastify.get<{ Params: JourneyParams }>('/:id', async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;
    const pool = fastify.pg;

    // Get journey
    const journeyResult = await pool.query(
      'SELECT id, route_type, title, created_at FROM journeys WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (journeyResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Journey not found' });
    }

    // Get verified photos for this journey
    const photosResult = await pool.query(
      'SELECT id, photo_path, gps_lat, gps_lng, verified, distance_meters, created_at FROM photos WHERE journey_id = $1 AND verified = true ORDER BY created_at DESC',
      [id]
    );

    return reply.send({
      ...journeyResult.rows[0],
      photos: photosResult.rows
    });
  });
};

export default journeyRoutes;
