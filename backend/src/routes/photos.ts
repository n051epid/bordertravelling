import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { photos } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import exifr from 'exifr';

export default async function photosRoutes(fastify: FastifyInstance) {
  // List user's photos
  fastify.get('/', { onRequest: [fastify.authenticate] }, async (request) => {
    const user = request.user;
    const list = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, user.id))
      .orderBy(photos.createdAt);
    return list;
  });

  // Get photo by ID
  fastify.get('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const photo = await db
      .select()
      .from(photos)
      .where(eq(photos.id, parseInt(id)))
      .get();

    if (!photo) {
      return reply.status(404).send({ error: 'Photo not found' });
    }
    return photo;
  });

  // Upload photo with optional GPS extraction
  fastify.post(
    '/upload',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user;
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file provided' });
      }

      // Read file buffer
      const buffer = Buffer.from(await data.toBuffer());
      const originalName = data.filename || 'unknown';
      const mimeType = data.mimetype;

      // Extract GPS from EXIF
      let latitude: number | null = null;
      let longitude: number | null = null;
      let altitude: number | null = null;
      let takenAt: Date | null = null;

      try {
        const exif = await exifr.parse(buffer, {
          gps: true,
          pick: ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'DateTimeOriginal'],
        });
        if (exif) {
          latitude = exif.GPSLatitude ?? null;
          longitude = exif.GPSLongitude ?? null;
          altitude = exif.GPSAltitude ?? null;
          if (exif.DateTimeOriginal) {
            takenAt = new Date(exif.DateTimeOriginal);
          }
        }
      } catch {
        // EXIF extraction failed, continue without GPS
      }

      // Generate unique filename
      const ext = originalName.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filepath = `./uploads/${filename}`;

      // Write file
      const { writeFileSync } = await import('node:fs');
      writeFileSync(filepath, buffer);

      // Insert into DB
      const result = await db
        .insert(photos)
        .values({
          userId: user.id,
          filename,
          originalName,
          mimeType,
          size: buffer.length,
          latitude,
          longitude,
          altitude,
          takenAt,
        })
        .returning()
        .get();

      return reply.status(201).send(result);
    }
  );

  // Delete photo
  fastify.delete('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const photo = await db
      .select()
      .from(photos)
      .where(eq(photos.id, parseInt(id)))
      .get();

    if (!photo) {
      return reply.status(404).send({ error: 'Photo not found' });
    }

    // Only owner can delete
    if (photo.userId !== request.user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    // Delete file
    try {
      const { unlinkSync } = await import('node:fs');
      unlinkSync(`./uploads/${photo.filename}`);
    } catch {
      // File may not exist
    }

    await db.delete(photos).where(eq(photos.id, parseInt(id)));
    return reply.send({ success: true });
  });
}
