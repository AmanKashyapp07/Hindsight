# Hindsight Development Roadmap

This document outlines the phased implementation plan for **Hindsight**, a lightweight, self-hostable, and framework-agnostic observability and tracing platform for LLM agents.

---

## Architecture Overview

```
Agent Code
   │  (TypeScript SDK: wrapper / decorator / AsyncLocalStorage)
   ▼
Ingestion API  ───►  Redis + BullMQ (asynchronous batching queue)
                          │
                          ▼
                     Worker Pool  ───►  PostgreSQL (traces, spans, cost & latency)
                                              │
                                              ▼
                                         Query API  ───►  React Dashboard
```

---

## Phase 1: Project Setup & Core Data Model
> **Goal:** Set up monorepo tooling, containerized infrastructure, and relational schema for traces and spans.

- **1.1 Monorepo Architecture**
  - Initialize Turborepo / pnpm workspaces.
  - Package structure:
    - `packages/sdk` (TypeScript SDK)
    - `packages/api` (Ingestion + Query API)
    - `packages/worker` (BullMQ background processor)
    - `packages/dashboard` (React + Vite + Tailwind UI)
    - `packages/shared` (Common TypeScript types, schemas, and utils)
- **1.2 Local Infrastructure (`docker-compose.yml`)**
  - PostgreSQL 16
  - Redis 7
- **1.3 Database Schema & Connection Pool (Raw SQL + pg.Pool)**
  - `traces`: `id` (UUIDv7/ULID), `name`, `status` (`running`, `success`, `error`), `start_time`, `end_time`, `total_tokens`, `total_cost`, `metadata` (JSONB).
  - `spans`: `id`, `trace_id` (FK), `parent_span_id` (nullable), `type` (`llm`, `tool`, `retrieval`, `custom`), `name`, `input` (JSONB), `output` (JSONB), `error` (text/JSONB), `tokens` (prompt/completion), `cost`, `latency_ms`, `start_time`, `end_time`.
  - Indexes on `trace_id`, `(trace_id, start_time)`, `status`, and `start_time`.
- **Acceptance Criteria:**
  - Local database and Redis spin up with `docker compose up`.
  - Migrations apply cleanly and seed data can be inserted without errors.

---

## Phase 2: Ingestion API & Async Queue Pipeline
> **Goal:** Build a high-throughput ingestion boundary that receives spans/traces and decouples database writes via Redis and BullMQ.

- **2.1 Shared Data Contract**
  - Zod schemas in `packages/shared` for payload validation (trace/span batches).
- **2.2 Ingestion HTTP Service (`packages/api`)**
  - Endpoint `POST /v1/traces`: Create or update trace metadata.
  - Endpoint `POST /v1/spans/batch`: Accept arrays of spans (up to 500 per payload).
  - Fast schema validation, immediate enqueue to Redis, returns `202 Accepted` (<10ms target overhead).
- **2.3 Worker Service (`packages/worker`)**
  - BullMQ consumer setup with configurable worker concurrency.
  - Batch collector: Drain queue jobs in micro-batches (e.g., 50–100 spans or every 500ms).
  - Idempotent batch `INSERT INTO spans ... ON CONFLICT DO UPDATE`.
  - Incremental aggregation: Update parent trace duration, total tokens, and total cost.
- **Acceptance Criteria:**
  - Ingestion endpoint responds in < 15ms.
  - Worker reliably batches and flushes spans into PostgreSQL under simulated high load without dropped records.

---

## Phase 3: TypeScript SDK
> **Goal:** Deliver an ergonomic client library that agents can import with near-zero latency impact.

- **3.1 Core Client (`packages/sdk`)**
  - Client initialization: `new HindsightClient({ endpoint, apiKey, batchSize, flushIntervalMs })`.
  - In-memory ring buffer for spans.
  - Background timer flush (default: 1s) and size threshold flush (default: 50 spans).
  - Non-blocking HTTP transport (`fetch` with retry and exponential backoff).
- **3.2 Instrumentation APIs**
  - Context tracking via Node.js `AsyncLocalStorage` for nested spans (`trace -> span -> sub-span`).
  - Manual API: `client.startTrace()`, `trace.startSpan()`, `span.end()`.
  - Wrapper API:
    ```ts
    const result = await hindsight.trace("rag-query", async (ctx) => {
      const docs = await ctx.span("retrieve-docs", () => searchDocs(q));
      return await ctx.span("llm-call", () => generateResponse(docs));
    });
    ```
- **3.3 Cost Calculator**
  - Token-to-cost lookup table (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, Llama 3) calculated automatically on LLM span completion.
- **Acceptance Criteria:**
  - A demo Node.js script using OpenAI / Anthropic can run, emit nested traces/spans, and exit cleanly with all traces flushed.

---

## Phase 4: Query API & Backend Read Layer
> **Goal:** Provide low-latency search, filtering, and hierarchical span tree retrieval for the dashboard.

- **4.1 Query Endpoints (`packages/api`)**
  - `GET /v1/traces`: Paginated list with filtering (date range, status, min latency, min cost, metadata tags).
  - `GET /v1/traces/:id`: Full trace details with flat span collection.
  - `GET /v1/analytics/summary`: Run count, error rate, average latency, total cost over a given time window.
- **4.2 Optimization & Aggregation**
  - Construct hierarchical execution tree (`parent_span_id` linking).
  - Cursor-based pagination for high-volume traces.
- **Acceptance Criteria:**
  - Traces containing 100+ nested spans can be queried and assembled in < 50ms.

---

## Phase 5: Web Dashboard (React UI)
> **Goal:** Interactive web UI to inspect, filter, and step-through replay agent executions.

- **5.1 Trace List & Filter View**
  - Filterable table with status badges (`SUCCESS`, `FAILED`, `RUNNING`).
  - Duration, token count, cost, and timestamp columns.
  - Filter bar (status, time window, search query).
- **5.2 Trace Detail & Replay View**
  - **Waterfall / Timeline:** Visual execution breakdown showing sequential and concurrent steps.
  - **Tree Navigation:** Expandable/collapsible nested step tree.
  - **Step Inspector Drawer:**
    - Input payload (syntax-highlighted JSON / markdown).
    - Output payload.
    - Latency and token cost breakdown.
    - Error stack trace for failed steps.
- **Acceptance Criteria:**
  - Users can click on a failed trace, immediately locate the erroneous tool call on the timeline, and inspect the raw input/output.

---

## Phase 6: Hardening, Reliability & Production Packaging
> **Goal:** Prepare the platform for self-hosted deployments, security, and fault tolerance.

- **6.1 Authentication & Multi-Project Support**
  - API key validation for ingestion and dashboard access.
  - Project/Namespace header support (`x-project-id`).
- **6.2 Error Handling & Resilience**
  - BullMQ Dead-Letter Queue (DLQ) for malformed spans.
  - Backpressure and memory safeguards in Redis (fail-safe for agent processes).
- **6.3 Production Deployment**
  - Multi-stage Dockerfiles for API, worker, and dashboard.
  - Unified `docker-compose.prod.yml` ready for single-node deployment (VPS, Railway, Fly.io).
- **Acceptance Criteria:**
  - Running `docker compose -f docker-compose.prod.yml up` starts the entire stack with zero manual steps.

---

## Phase 7: Benchmarks, Demos & Documentation
> **Goal:** Validate performance claims and provide reference integrations.

- **7.1 Benchmarking Suite (`benchmarks/`)**
  - Ingestion throughput: Spans/sec vs CPU/RAM usage.
  - SDK overhead: Agent latency with vs. without Hindsight wrapping (target: < 2ms added overhead per span).
  - Storage footprint: Average bytes stored per 1,000 spans.
- **7.2 Example Projects (`examples/`)**
  - `examples/raw-sdk-agent`: Pure TypeScript agent using tool-calling with OpenAI / Claude.
  - `examples/langchain-agent`: Multi-step agent integration.
- **7.3 Docs & Launch**
  - Quickstart guide (install SDK, run Docker, view first trace in 3 minutes).
  - Architecture diagrams and published benchmark results in `README.md`.
- **Acceptance Criteria:**
  - Automated benchmark script runs and outputs verified metrics for the README.
