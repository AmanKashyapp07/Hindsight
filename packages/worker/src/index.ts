import dotenv from 'dotenv';
dotenv.config();

console.log('[Hindsight Worker] Initialized. Ready for queue consumer setup in Phase 2.');

export function startWorker(): void {
  console.log('[Hindsight Worker] Worker loop ready.');
}

if (process.env.NODE_ENV !== 'test') {
  startWorker();
}
