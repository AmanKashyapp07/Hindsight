export type TraceStatus = 'RUNNING' | 'SUCCESS' | 'ERROR';

export type SpanType = 'LLM' | 'TOOL' | 'RETRIEVAL' | 'CUSTOM';

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface TraceMetadata {
  [key: string]: unknown;
}

export interface Trace {
  id: string;
  name: string;
  status: TraceStatus;
  startTime: string; // ISO timestamp
  endTime?: string | null;
  totalTokens: number;
  totalCost: number;
  metadata?: TraceMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface Span {
  id: string;
  traceId: string;
  parentSpanId?: string | null;
  type: SpanType;
  name: string;
  input?: unknown;
  output?: unknown;
  error?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  cost?: number | null;
  latencyMs?: number | null;
  startTime: string; // ISO timestamp
  endTime?: string | null;
  createdAt: string;
}

export interface TraceWithSpans extends Trace {
  spans: Span[];
}
