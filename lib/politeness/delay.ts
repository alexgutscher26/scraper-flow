import { PolitenessConfig } from "@/types/politeness";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalRandom(mean: number, stdDev: number) {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}

export function computeDelayMs(config: PolitenessConfig) {
  const min = Math.max(0, config.delays.minMs);
  const max = Math.max(min, config.delays.maxMs);
  let base = 0;
  if (config.delays.strategy === "uniform") {
    base = min + Math.random() * (max - min);
  } else {
    const mean = (min + max) / 2;
    const std = (max - min) / 6;
    base = normalRandom(mean, std);
  }
  const jitter = base * (config.delays.jitterPct ?? 0);
  const jittered = base + (Math.random() < 0.5 ? -jitter : jitter);
  return Math.round(clamp(jittered, min, max));
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

