import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';

const fastify = Fastify({
  logger: true,
});

// Allow both local development and production frontend
const corsOrigins = process.env.NODE_ENV === 'production'
  ? ['https://border.qinglv.online', 'https://www.border.qinglv.online']
  : true;
await fastify.register(cors, { origin: corsOrigins });
await fastify.register(jwt, { secret: process.env.JWT_SECRET || 'supersecretkey' });

// JWT authenticate decorator
fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});
await fastify.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

fastify.get('/health', async () => ({ status: 'ok' }));

// Import routes with dynamic imports
const authRoutes = await import('./routes/auth.js');
const usersRoutes = await import('./routes/users.js');
const photosRoutes = await import('./routes/photos.js');
const journeysRoutes = await import('./routes/journeys.js');
const routesRoutes = await import('./routes/routes.js');

fastify.register(authRoutes.default, { prefix: '/api/auth' });
fastify.register(usersRoutes.default, { prefix: '/api/users' });
fastify.register(photosRoutes.default, { prefix: '/api/photos' });
fastify.register(journeysRoutes.default, { prefix: '/api/journeys' });
fastify.register(routesRoutes.default, { prefix: '/api/routes' });

const start = async () => {
  try {
    const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
await fastify.listen({ port: PORT, host: HOST });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
