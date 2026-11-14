import { Span, Trace } from '@hindsight/shared';

export interface HindsightConfig {
  endpoint?: string;
  apiKey?: string;
  batchSize?: number;
  flushIntervalMs?: number;
  disabled?: boolean;
}

export class HindsightClient {
  private endpoint: string;
  private apiKey?: string;
  private batchSize: number;
  private flushIntervalMs: number;
  private disabled: boolean;
  private spanBuffer: Span[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: HindsightConfig = {}) {
    this.endpoint = (config.endpoint || process.env.HINDSIGHT_ENDPOINT || 'http://localhost:3001').replace(/\/$/, '');
    this.apiKey = config.apiKey || process.env.HINDSIGHT_API_KEY;
    this.batchSize = config.batchSize || 50;
    this.flushIntervalMs = config.flushIntervalMs || 1000;
    this.disabled = config.disabled ?? false;

    if (!this.disabled && typeof process !== 'undefined') {
      this.startFlushLoop();
      process.on('beforeExit', () => this.flush());
    }
  }

  public recordSpan(span: Span): void {
    if (this.disabled) return;
    this.spanBuffer.push(span);
    if (this.spanBuffer.length >= this.batchSize) {
      void this.flush();
    }
  }

  public async recordTrace(trace: Trace): Promise<void> {
    if (this.disabled) return;
    try {
      await fetch(`${this.endpoint}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(trace),
      });
    } catch (err) {
      // Fail silently to never break the host agent
      console.warn('[Hindsight] Failed to record trace:', err);
    }
  }

  public async flush(): Promise<void> {
    if (this.spanBuffer.length === 0) return;
    const batch = [...this.spanBuffer];
    this.spanBuffer = [];

    try {
      await fetch(`${this.endpoint}/v1/spans/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ spans: batch }),
      });
    } catch (err) {
      console.warn('[Hindsight] Failed to flush span batch:', err);
    }
  }

  private startFlushLoop(): void {
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);

    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  public close(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}
