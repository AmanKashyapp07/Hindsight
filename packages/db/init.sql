-- Hindsight PostgreSQL Schema Initialization (Idempotent)

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TraceStatus') THEN
        CREATE TYPE "TraceStatus" AS ENUM ('RUNNING', 'SUCCESS', 'ERROR');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SpanType') THEN
        CREATE TYPE "SpanType" AS ENUM ('LLM', 'TOOL', 'RETRIEVAL', 'CUSTOM');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS traces (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status "TraceStatus" NOT NULL DEFAULT 'RUNNING',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_traces_status_start_time ON traces(status, start_time);
CREATE INDEX IF NOT EXISTS idx_traces_start_time_desc ON traces(start_time DESC);

CREATE TABLE IF NOT EXISTS spans (
    id VARCHAR(128) PRIMARY KEY,
    trace_id VARCHAR(128) NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
    parent_span_id VARCHAR(128) REFERENCES spans(id) ON DELETE SET NULL,
    type "SpanType" NOT NULL,
    name VARCHAR(255) NOT NULL,
    input JSONB,
    output JSONB,
    error TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost DOUBLE PRECISION,
    latency_ms DOUBLE PRECISION,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_spans_trace_id_start_time ON spans(trace_id, start_time);
CREATE INDEX IF NOT EXISTS idx_spans_trace_id ON spans(trace_id);
CREATE INDEX IF NOT EXISTS idx_spans_parent_span_id ON spans(parent_span_id);
CREATE INDEX IF NOT EXISTS idx_spans_type ON spans(type);
