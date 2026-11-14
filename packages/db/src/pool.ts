import pg, { PoolConfig, QueryResult, QueryResultRow, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Look for .env in current directory or workspace root
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '../.env'),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const { Pool } = pg;

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hindsight?schema=public',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT_MS || '5000', 10),
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[Hindsight DB Pool Error]:', err);
});

/**
 * Execute a parameterized SQL query using the connection pool.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (process.env.DEBUG_SQL === 'true') {
    console.log('[SQL]', { text, duration, rows: res.rowCount });
  }

  return res;
}

/**
 * Acquire a dedicated client from the pool (must release after use).
 */
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * Run a callback inside a managed transaction with automatic COMMIT / ROLLBACK.
 */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Gracefully close all connections in the pool.
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
