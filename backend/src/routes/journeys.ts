import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { journeys, journeyPhotos } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const createJourneySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  routeId: z.number().optional(),
  status: z.enum(['planning', 'active', 'completed']).default('planning'),
});

const updateJourneySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  routeId: z.number().optional(),
  status: z.enum(['planning', 'active', 'completed']).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});

const addPhotoSchema = z.object({
  photoId: z.number(),
  orderIndex: z.number().default(0),
  caption: z.string().optional(),
});

export default async function journeysRoutes(fastify: FastifyInstance) {
  // List user's journeys
  fastify.get('/', { onRequest: [fastify.authenticate] }, async (request) => {
    const user = request.user;
    const list = await db
      .select()
      .from(journeys)
      .where(eq(journeys.userId, user.id))
      .orderBy(desc(journeys.createdAt));
    return list;
  });

  // Get journey detail
  fastify.get('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const journey = await db
      .select()
      .from(journeys)
      .where(eq(journeys.id, parseInt(id)))
      .get();

    if (!journey) {
      return reply.status(404).send({ error: 'Journey not found' });
    }

    // Get associated photos
    const associated = await db
      .select()
      .from(journeyPhotos)
      .where(eq(journeyPhotos.journeyId, parseInt(id)));

    return { ...journey, photos: associated };
  });

  // Create journey
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const body = createJourneySchema.parse(request.body);

    const result = await db
      .insert(journeys)
      .values({
        userId: user.id,
        title: body.title,
        description: body.description,
        routeId: body.routeId,
        status: body.status,
      })
      .returning()
      .get();

    return reply.status(201).send(result);
  });

  // Update journey
  fastify.patch('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateJourneySchema.parse(request.body);

    const existing = await db
      .select()
      .from(journeys)
      .where(eq(journeys.id, parseInt(id)))
      .get();

    if (!existing) {
      return reply.status(404).send({ error: 'Journey not found' });
    }

    if (existing.userId !== request.user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const result = await db
      .update(journeys)
      .set({
        ...body,
        startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
        endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
      })
      .where(eq(journeys.id, parseInt(id)))
      .returning()
      .get();

    return result;
  });

  // Delete journey
  fastify.delete('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await db
      .select()
      .from(journeys)
      .where(eq(journeys.id, parseInt(id)))
      .get();

    if (!existing) {
      return reply.status(404).send({ error: 'Journey not found' });
    }

    if (existing.userId !== request.user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    // Delete associated journey-photos first
    await db.delete(journeyPhotos).where(eq(journeyPhotos.journeyId, parseInt(id)));
    await db.delete(journeys).where(eq(journeys.id, parseInt(id)));

    return reply.send({ success: true });
  });

  // Add photo to journey
  fastify.post('/:id/photos', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = addPhotoSchema.parse(request.body);

    const journey = await db
      .select()
      .from(journeys)
      .where(eq(journeys.id, parseInt(id)))
      .get();

    if (!journey) {
      return reply.status(404).send({ error: 'Journey not found' });
    }

    if (journey.userId !== request.user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const result = await db
      .insert(journeyPhotos)
      .values({
        journeyId: parseInt(id),
        photoId: body.photoId,
        orderIndex: body.orderIndex,
        caption: body.caption,
      })
      .returning()
      .get();

    return reply.status(201).send(result);
  });
}
