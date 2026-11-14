import { query, transaction } from '../pool.js';
import type { Span, SpanType } from '@hindsight/shared';

interface SpanRow {
  id: string;
  trace_id: string;
  parent_span_id: string | null;
  type: SpanType;
  name: string;
  input: unknown;
  output: unknown;
  error: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  cost: number | null;
  latency_ms: number | null;
  start_time: Date;
  end_time: Date | null;
  created_at: Date;
}

function mapSpanRow(row: SpanRow): Span {
  return {
    id: row.id,
    traceId: row.trace_id,
    parentSpanId: row.parent_span_id,
    type: row.type,
    name: row.name,
    input: row.input,
    output: row.output,
    error: row.error,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    cost: row.cost,
    latencyMs: row.latency_ms,
    startTime: row.start_time.toISOString(),
    endTime: row.end_time ? row.end_time.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  };
}

export async function insertSpansBatch(spans: Span[]): Promise<void> {
  if (spans.length === 0) return;

  await transaction(async (client) => {
    for (const span of spans) {
      const sql = `
        INSERT INTO spans (
          id, trace_id, parent_span_id, type, name, input, output, error,
          prompt_tokens, completion_tokens, total_tokens, cost, latency_ms,
          start_time, end_time
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        ON CONFLICT (id) DO UPDATE SET
          output = COALESCE(EXCLUDED.output, spans.output),
          error = COALESCE(EXCLUDED.error, spans.error),
          end_time = COALESCE(EXCLUDED.end_time, spans.end_time),
          latency_ms = COALESCE(EXCLUDED.latency_ms, spans.latency_ms);
      `;

      const values = [
        span.id,
        span.traceId,
        span.parentSpanId || null,
        span.type,
        span.name,
        span.input ? JSON.stringify(span.input) : null,
        span.output ? JSON.stringify(span.output) : null,
        span.error || null,
        span.promptTokens ?? null,
        span.completionTokens ?? null,
        span.totalTokens ?? null,
        span.cost ?? null,
        span.latencyMs ?? null,
        span.startTime,
        span.endTime || null,
      ];

      await client.query(sql, values);
    }
  });
}

export async function getSpansByTraceId(traceId: string): Promise<Span[]> {
  const sql = `
    SELECT * FROM spans
    WHERE trace_id = $1
    ORDER BY start_time ASC;
  `;
  const res = await query<SpanRow>(sql, [traceId]);
  return res.rows.map(mapSpanRow);
}
