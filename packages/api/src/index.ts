import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { IngestTraceSchema, IngestSpansBatchSchema } from '@hindsight/shared';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'hindsight-api', timestamp: new Date().toISOString() });
});

// Trace ingestion placeholder
app.post('/v1/traces', (req: Request, res: Response) => {
  const parseResult = IngestTraceSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid trace payload', details: parseResult.error.format() });
    return;
  }
  // Enqueued to Redis in Phase 2
  res.status(202).json({ status: 'accepted', traceId: parseResult.data.id });
});

// Batch spans ingestion placeholder
app.post('/v1/spans/batch', (req: Request, res: Response) => {
  const parseResult = IngestSpansBatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid spans batch payload', details: parseResult.error.format() });
    return;
  }
  // Enqueued to Redis in Phase 2
  res.status(202).json({ status: 'accepted', count: parseResult.data.spans.length });
});

app.listen(config.port, config.host, () => {
  console.log(`[Hindsight API] Listening on http://${config.host}:${config.port}`);
});
