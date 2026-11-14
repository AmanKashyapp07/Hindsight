# Hindsight

Lightweight observability and tracing for LLM agents. Record every step of an agent run (prompts, tool calls, latencies, token costs, errors), then search, replay, and analyze runs from a web dashboard.

> Status: planning. This README describes the intended design and roadmap. Sections marked TBD will be filled in as the project is built.

---

## Why this project

LLM agents fail in ways that are hard to debug: a bad tool call three steps back, a silently retried request, a cost spike from a looping prompt. Existing tools are either hosted, heavy, or tied to a specific framework. AgentLens aims to be small, self-hostable, and framework-agnostic, with a focus on a fast, reliable ingestion pipeline.

## Goals

- Instrument any agent with a few lines of code (decorator or wrapper).
- Ingest high volumes of trace data without slowing the instrumented agent.
- Make traces easy to search, filter, and replay step by step.
- Show cost and latency per step, per run, and over time.
- Be measurable: publish benchmarks for ingestion throughput and query latency.

## Non-goals (for v1)

- Multi-tenant SaaS features (billing, orgs, SSO).
- Evaluation or prompt-optimization tooling.
- Support for every language. v1 targets TypeScript only.

---

## Architecture (planned)

```
Agent code
   |  (TS SDK: wrapper / decorator)
   v
Ingestion API  --->  Redis + BullMQ (batching queue)
                          |
                          v
                     Worker pool  --->  PostgreSQL (traces, spans, costs)
                                              |
                                              v
                                   Query API  --->  React dashboard
```

| Component | Responsibility | Tech |
|---|---|---|
| SDK | Capture spans, buffer locally, send in batches | TypeScript |
| Ingestion API | Validate, authenticate, enqueue | Node.js, Express |
| Queue and workers | Batch writes, retries, backpressure | Redis, BullMQ |
| Storage | Traces, spans, token and cost data | PostgreSQL |
| Query API | Search, filters, aggregates | Node.js |
| Dashboard | Trace list, replay view, analytics | React, Tailwind CSS |

## Data model (draft)

- **Trace**: one agent run. Fields: id, name, start/end time, status, total tokens, total cost, metadata.
- **Span**: one step within a trace (LLM call, tool call, retrieval, custom). Fields: id, trace_id, parent_span_id, type, input, output, latency, tokens, cost, error.
- Indexing plan: by trace start time, status, and tag; full-text search on span input/output (TBD).

---

## Planned features

**Core (v1)**
- TypeScript SDK with automatic capture of latency, inputs, outputs, and errors
- Batched asynchronous ingestion with retries
- Trace list with filters (time range, status, cost, latency)
- Trace replay view showing the span tree and each step's input and output
- Per-step and per-run cost and token accounting

**Extensions (v2)**
- Cost and latency analytics over time
- Error alerts (webhook or email)
- Sampling and retention policies
- Payload compression and large-output offloading
- Python SDK

---

## Roadmap

| Phase | Focus | Deliverable |
|---|---|---|
| 1 | Foundations | Repo setup, data model, schema migrations, basic ingestion API |
| 2 | SDK | TypeScript SDK, span capture, local buffering, batching |
| 3 | Pipeline | BullMQ workers, batched Postgres writes, retries, backpressure |
| 4 | Dashboard | Trace list, filters, span-tree replay view |
| 5 | Analytics | Cost and latency charts, search, indexing tuning |
| 6 | Hardening | Auth, rate limiting, tests, Docker Compose setup |
| 7 | Benchmarks and docs | Benchmark suite, architecture write-up, demo agent integration |

## Benchmarks (TBD)

Metrics to measure and publish:

- Ingestion throughput (spans/sec) at different worker concurrency levels
- SDK overhead on the instrumented agent (added latency per span)
- p50 and p95 query latency over 1M+ stored spans
- Storage per trace before and after batching and compression
- Write latency: direct inserts vs. queued batch inserts

## Design questions to resolve

- Postgres only, or add a columnar store for analytics queries?
- Span payload storage: inline JSONB vs. separate blob table
- Sampling strategy: head-based vs. tail-based
- Delivery guarantees: at-least-once with idempotent writes
- Retention and partitioning strategy for the spans table

---

## Planned repo structure

```
agentlens/
  packages/
    sdk/          # TypeScript SDK
    api/          # Ingestion and query API
    worker/       # BullMQ workers
    dashboard/    # React UI
  examples/       # Demo agents instrumented with the SDK
  benchmarks/     # Load tests and result scripts
  docs/           # Architecture and design notes
  docker-compose.yml
```

## Getting started

TBD. Will include Docker Compose setup, SDK installation, and a minimal instrumented-agent example.

## Tech stack

TypeScript, Node.js, Express, PostgreSQL, Redis, BullMQ, React, Tailwind CSS, Docker

## License

TBD