import { z } from 'zod';

export const TraceStatusSchema = z.enum(['RUNNING', 'SUCCESS', 'ERROR']);

export const SpanTypeSchema = z.enum(['LLM', 'TOOL', 'RETRIEVAL', 'CUSTOM']);

export const IngestTraceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: TraceStatusSchema.default('RUNNING'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional().nullable(),
  totalTokens: z.number().int().nonnegative().default(0),
  totalCost: z.number().nonnegative().default(0),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const IngestSpanSchema = z.object({
  id: z.string().min(1),
  traceId: z.string().min(1),
  parentSpanId: z.string().optional().nullable(),
  type: SpanTypeSchema,
  name: z.string().min(1),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  error: z.string().optional().nullable(),
  promptTokens: z.number().int().nonnegative().optional().nullable(),
  completionTokens: z.number().int().nonnegative().optional().nullable(),
  totalTokens: z.number().int().nonnegative().optional().nullable(),
  cost: z.number().nonnegative().optional().nullable(),
  latencyMs: z.number().nonnegative().optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional().nullable(),
});

export const IngestSpansBatchSchema = z.object({
  spans: z.array(IngestSpanSchema).min(1).max(1000),
});

export const QueryTracesFilterSchema = z.object({
  status: TraceStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  name: z.string().optional(),
  startTimeFrom: z.string().datetime().optional(),
  startTimeTo: z.string().datetime().optional(),
});
