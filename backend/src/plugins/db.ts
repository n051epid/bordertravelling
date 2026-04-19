import { Pool } from 'pg';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

interface DbPluginOptions {
  connectionString: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    pg: Pool;
  }
}

const dbPlugin: FastifyPluginAsync<DbPluginOptions> = async (fastify, options) => {
  const pool = new Pool({
    connectionString: options.connectionString,
  });

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    fastify.log.info('Database connected successfully');
  } catch (err) {
    fastify.log.error('Database connection failed:', err);
    throw err;
  }

  fastify.decorate('pg', pool);

  fastify.addHook('onClose', async () => {
    await pool.end();
  });
};

export default fp(dbPlugin, {
  name: 'db',
});
