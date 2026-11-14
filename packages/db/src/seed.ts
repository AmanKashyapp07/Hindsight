import { upsertTrace } from './queries/traces.js';
import { insertSpansBatch } from './queries/spans.js';
import { query, closePool } from './pool.js';
import type { Span } from '@hindsight/shared';

async function seed() {
  console.log('[Hindsight DB] Seeding database with demo traces and spans...');

  const traceId = 'trace_demo_01j7xyz890';
  const rootSpanId = 'span_root_01j7xyz891';
  const toolSpanId = 'span_tool_01j7xyz892';
  const llmSpanId = 'span_llm_01j7xyz893';

  // Cleanup old demo data
  await query('DELETE FROM traces WHERE id = $1', [traceId]);

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 2450);

  const trace = await upsertTrace({
    id: traceId,
    name: 'weather-research-agent',
    status: 'SUCCESS',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    totalTokens: 1420,
    totalCost: 0.0071,
    metadata: {
      agentVersion: '1.2.0',
      environment: 'development',
      model: 'gpt-4o',
    },
  });

  const demoSpans: Span[] = [
    {
      id: rootSpanId,
      traceId: trace.id,
      parentSpanId: null,
      type: 'CUSTOM',
      name: 'execute-agent-flow',
      input: { query: 'What is the weather in Seattle and recommend an outfit?' },
      output: { summary: 'Rainy and 52°F. Recommended: waterproof jacket and boots.' },
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      latencyMs: 2450,
      totalTokens: 1420,
      cost: 0.0071,
      createdAt: startTime.toISOString(),
    },
    {
      id: toolSpanId,
      traceId: trace.id,
      parentSpanId: rootSpanId,
      type: 'TOOL',
      name: 'weather_api_call',
      input: { location: 'Seattle, WA' },
      output: { temp: 52, condition: 'Light Rain', humidity: 85 },
      startTime: new Date(startTime.getTime() + 100).toISOString(),
      endTime: new Date(startTime.getTime() + 450).toISOString(),
      latencyMs: 350,
      createdAt: startTime.toISOString(),
    },
    {
      id: llmSpanId,
      traceId: trace.id,
      parentSpanId: rootSpanId,
      type: 'LLM',
      name: 'gpt-4o-completion',
      input: {
        messages: [
          { role: 'system', content: 'You are an outfit recommendation assistant.' },
          { role: 'user', content: 'Seattle weather: Light Rain, 52°F. Suggest clothes.' },
        ],
      },
      output: {
        content: 'I recommend wearing a waterproof hooded jacket, dark jeans, and water-resistant boots.',
      },
      promptTokens: 820,
      completionTokens: 600,
      totalTokens: 1420,
      cost: 0.0071,
      startTime: new Date(startTime.getTime() + 500).toISOString(),
      endTime: new Date(startTime.getTime() + 2400).toISOString(),
      latencyMs: 1900,
      createdAt: startTime.toISOString(),
    },
  ];

  await insertSpansBatch(demoSpans);
  console.log(`[Hindsight DB] Seeded demo trace: ${trace.id} with ${demoSpans.length} spans.`);
}

seed()
  .catch((err) => {
    console.error('[Hindsight DB] Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
