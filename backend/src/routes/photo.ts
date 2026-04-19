import { FastifyPluginAsync } from 'fastify';
import { pipeline } from 'stream/promises';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import ExifParser from 'exif-parser';
import { haversine } from '../utils/haversine';

interface UploadBody {
  journey_id?: string;
}

interface PhotoQuery {
  journey_id?: string;
}

// Route type definitions for G219, G331, G228 (simplified route coordinates)
// In production, these would be stored in a database with actual route paths
const ROUTE_GPS_POINTS: Record<string, { lat: number; lng: number }[]> = {
  'G219': [
    { lat: 39.9042, lng: 116.4074 }, // Beijing
    { lat: 40.1582, lng: 116.5895 },
    { lat: 40.3528, lng: 116.8472 },
  ],
  'G331': [
    { lat: 41.8044, lng: 123.4328 }, // Shenyang
    { lat: 41.1067, lng: 124.3856 },
    { lat: 41.8096, lng: 125.1333 },
  ],
  'G228': [
    { lat: 31.2304, lng: 121.4737 }, // Shanghai
    { lat: 30.5728, lng: 122.0728 },
    { lat: 29.8683, lng: 121.5440 },
  ],
};

// Verification threshold in meters
const VERIFICATION_THRESHOLD_METERS = 5000;

const photoRoutes: FastifyPluginAsync = async (fastify) => {
  // Add auth decorator
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Upload and verify photo
  fastify.post<{ 
    Body: UploadBody;
  }>('/upload', async (request, reply) => {
    const userId = (request.user as any).id;
    const pool = fastify.pg;

    // Get journey_id from body if provided
    const journeyId = (request.body as any).journey_id;

    // Process multipart form data
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No photo file provided' });
    }

    // Read file buffer
    const buffer = await data.toBuffer();

    // Parse EXIF data
    let gpsLat: number | null = null;
    let gpsLng: number | null = null;

    try {
      const parser = ExifParser.create(buffer);
      const result = parser.parse();
      
      if (result.tags && result.tags.GPSLatitude && result.tags.GPSLongitude) {
        gpsLat = result.tags.GPSLatitude;
        gpsLng = result.tags.GPSLongitude;
      }
    } catch (err) {
      fastify.log.warn('Could not parse EXIF data:', err);
    }

    // If no GPS data, return error
    if (gpsLat === null || gpsLng === null) {
      return reply.status(400).send({ 
        error: 'No GPS data found in photo EXIF',
        gps_lat: null,
        gps_lng: null,
        verified: false,
        distance_meters: null
      });
    }

    // Ensure upload directory exists
    const uploadDir = process.env.UPLOAD_DIR || '/data/apps/bordertravelling/uploads';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    const filename = `${Date.now()}-${data.filename}`;
    const filePath = join(uploadDir, filename);
    await pipeline(data.file, createWriteStream(filePath));

    // Determine which route the photo belongs to based on journey_id if provided
    let routeType: string | null = null;
    let nearestDistance = Infinity;
    let verified = false;

    if (journeyId) {
      // Get journey's route_type
      const journeyResult = await pool.query(
        'SELECT route_type FROM journeys WHERE id = $1 AND user_id = $2',
        [journeyId, userId]
      );

      if (journeyResult.rows.length > 0) {
        routeType = journeyResult.rows[0].route_type;
      }
    }

    // Calculate distance to nearest route point
    if (routeType) {
      const routePoints = ROUTE_GPS_POINTS[routeType] || [];
      
      for (const point of routePoints) {
        const distance = haversine(gpsLat!, gpsLng!, point.lat, point.lng);
        if (distance < nearestDistance) {
          nearestDistance = distance;
        }
      }

      verified = nearestDistance <= VERIFICATION_THRESHOLD_METERS;
    }

    // Save photo record to database
    const result = await pool.query(
      `INSERT INTO photos (user_id, journey_id, photo_path, gps_lat, gps_lng, verified, distance_meters) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, photo_path, gps_lat, gps_lng, verified, distance_meters`,
      [userId, journeyId, `/uploads/${filename}`, gpsLat, gpsLng, verified, Math.round(nearestDistance)]
    );

    return reply.status(201).send(result.rows[0]);
  });

  // Get photos for a journey
  fastify.get<{ Querystring: PhotoQuery }>('/', async (request, reply) => {
    const userId = (request.user as any).id;
    const { journey_id } = request.query;
    const pool = fastify.pg;

    let query = 'SELECT id, photo_path, gps_lat, gps_lng, verified, distance_meters, created_at FROM photos WHERE user_id = $1';
    const params: any[] = [userId];

    if (journey_id) {
      query += ' AND journey_id = $2';
      params.push(journey_id);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    return reply.send(result.rows);
  });
};

export default photoRoutes;
