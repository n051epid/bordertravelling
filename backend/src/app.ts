import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import { load } from 'dotenv';
import dbPlugin from './plugins/db.js';
import authRoutes from './routes/auth.js';
import journeyRoutes from './routes/journey.js';
import photoRoutes from './routes/photo.js';

// Load environment variables
load();

const fastify = Fastify({
  logger: true,
});

// Register JWT plugin
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
});

// Register multipart plugin for file uploads
fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Register database plugin
fastify.register(dbPlugin, {
  connectionString: process.env.DATABASE_URL || 'postgresql://border_user:BorderUser2024!@#@47.95.170.152:5432/bordertravelling',
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/v1/auth' });
fastify.register(journeyRoutes, { prefix: '/api/v1/journeys' });
fastify.register(photoRoutes, { prefix: '/api/v1/photos' });

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
