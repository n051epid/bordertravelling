import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// In-memory code store: phone -> { code, expiresAt }
const codeStore = new Map<string, { code: string; expiresAt: number }>();

const sendCodeSchema = z.object({
  phone: z.string().min(11).max(11),
});

const verifySchema = z.object({
  phone: z.string().min(11).max(11),
  code: z.string().length(6),
});

// JWT payload type
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number; phone: string };
    user: { id: number; phone: string };
  }
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Send verification code
  fastify.post('/send-code', async (request, reply) => {
    const { phone } = sendCodeSchema.parse(request.body);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store in memory
    codeStore.set(phone, { code, expiresAt });

    // TODO: Integrate real SMS provider (e.g., Twilio, Alibaba Cloud)
    console.log(`[SMS] To ${phone}: Your code is ${code}`);

    return reply.send({ success: true, message: '验证码已发送' });
  });

  // Verify code and issue JWT
  fastify.post('/verify', async (request, reply) => {
    const { phone, code } = verifySchema.parse(request.body);

    // Validate code
    const stored = codeStore.get(phone);
    if (!stored || stored.code !== code || stored.expiresAt < Date.now()) {
      return reply.status(400).send({ error: '验证码无效或已过期' });
    }

    // Delete used code
    codeStore.delete(phone);

    // Find or create user
    let user;
    const existing = await db.select().from(users).where(eq(users.phone, phone)).get();

    if (existing) {
      user = existing;
    } else {
      // Auto-create user with generated username
      const username = `user_${phone.slice(-4)}_${Date.now().toString(36)}`;
      const result = await db.insert(users).values({ phone, username }).returning().get();
      user = result;
    }

    // Sign JWT
    const token = fastify.jwt.sign({ id: user.id, phone: user.phone });

    return reply.send({ token, user: { id: user.id, phone: user.phone } });
  });

  // Get current user (protected)
  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request: FastifyRequest) => {
    return request.user;
  });
}
