import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    return reply.status(201).send({ message: 'User registered', email: body.email });
  });

  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    return reply.send({ message: 'Login successful' });
  });

  fastify.post('/logout', async (request, reply) => {
    return reply.send({ message: 'Logout successful' });
  });
}
