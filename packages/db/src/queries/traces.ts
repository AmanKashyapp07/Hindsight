import { query } from '../pool.js';
import type { Trace, TraceStatus } from '@hindsight/shared';

interface TraceRow {
  id: string;
  name: string;
  status: TraceStatus;
  start_time: Date;
  end_time: Date | null;
  total_tokens: number;
  total_cost: number;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
}

function mapTraceRow(row: TraceRow): Trace {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    startTime: row.start_time.toISOString(),
    endTime: row.end_time ? row.end_time.toISOString() : null,
    totalTokens: row.total_tokens,
    totalCost: row.total_cost,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function upsertTrace(trace: {
  id: string;
  name: string;
  status?: TraceStatus;
  startTime: string;
  endTime?: string | null;
  totalTokens?: number;
  totalCost?: number;
  metadata?: Record<string, unknown> | null;
}): Promise<Trace> {
  const sql = `
    INSERT INTO traces (
      id, name, status, start_time, end_time, total_tokens, total_cost, metadata, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      status = EXCLUDED.status,
      end_time = COALESCE(EXCLUDED.end_time, traces.end_time),
      total_tokens = GREATEST(traces.total_tokens, EXCLUDED.total_tokens),
      total_cost = GREATEST(traces.total_cost, EXCLUDED.total_cost),
      metadata = COALESCE(EXCLUDED.metadata, traces.metadata),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const values = [
    trace.id,
    trace.name,
    trace.status || 'RUNNING',
    trace.startTime,
    trace.endTime || null,
    trace.totalTokens || 0,
    trace.totalCost || 0.0,
    trace.metadata ? JSON.stringify(trace.metadata) : null,
  ];

  const res = await query<TraceRow>(sql, values);
  return mapTraceRow(res.rows[0]);
}

export async function getTraceById(id: string): Promise<Trace | null> {
  const sql = `SELECT * FROM traces WHERE id = $1 LIMIT 1;`;
  const res = await query<TraceRow>(sql, [id]);
  if (res.rows.length === 0) return null;
  return mapTraceRow(res.rows[0]);
}

export async function listTraces(options: {
  status?: TraceStatus;
  limit?: number;
  cursor?: string;
} = {}): Promise<Trace[]> {
  const limit = options.limit || 20;
  const values: unknown[] = [];
  let sql = `SELECT * FROM traces WHERE 1=1`;

  if (options.status) {
    values.push(options.status);
    sql += ` AND status = $${values.length}`;
  }

  if (options.cursor) {
    values.push(options.cursor);
    sql += ` AND start_time < (SELECT start_time FROM traces WHERE id = $${values.length})`;
  }

  values.push(limit);
  sql += ` ORDER BY start_time DESC LIMIT $${values.length};`;

  const res = await query<TraceRow>(sql, values);
  return res.rows.map(mapTraceRow);
}
