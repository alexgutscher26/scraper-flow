export type HttpMetric = {
  url: string;
  method: string;
  status: number;
  durationMs: number;
  sizeBytes?: number;
  timestamp: number;
};

type Listener = (m: HttpMetric) => void;

class HttpMetricsBus {
  private listeners: Set<Listener> = new Set();
  on(l: Listener) {
    this.listeners.add(l);
  }
  off(l: Listener) {
    this.listeners.delete(l);
  }
  emit(m: HttpMetric) {
    for (const l of this.listeners) l(m);
  }
}

export const httpMetricsBus = new HttpMetricsBus();

export function emitHttpMetric(metric: HttpMetric) {
  httpMetricsBus.emit(metric);
}
