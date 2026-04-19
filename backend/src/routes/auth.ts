import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    const { username, email, password } = request.body;

    if (!username || !email || !password) {
      return reply.status(400).send({ error: 'Username, email and password are required' });
    }

    const pool = fastify.pg;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return reply.status(409).send({ error: 'Username or email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    return reply.status(201).send(result.rows[0]);
  });

  // Login
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const pool = fastify.pg;

    // Find user
    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = fastify.jwt.sign({
      id: user.id,
      username: user.username,
      email: user.email
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  });
};

export default authRoutes;
