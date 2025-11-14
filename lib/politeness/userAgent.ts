import { PolitenessConfig, PolitenessState } from '@/types/politeness';
import { Page } from 'puppeteer';

const DEFAULT_UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
];

const ACCEPT_LANGUAGE_POOL = [
  'en-US,en;q=0.9',
  'en-GB,en;q=0.9',
  'de-DE,de;q=0.9,en;q=0.8',
  'fr-FR,fr;q=0.9,en;q=0.8',
  'es-ES,es;q=0.9,en;q=0.8',
];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function computeUA(config: PolitenessConfig, state: PolitenessState, url?: string) {
  const pool =
    config.userAgent.pool && config.userAgent.pool.length > 0
      ? config.userAgent.pool
      : DEFAULT_UA_POOL;
  if (config.userAgent.rotateStrategy === 'perSession') {
    if (!state.uaPerSession) state.uaPerSession = pick(pool);
    return state.uaPerSession;
  }
  if (config.userAgent.rotateStrategy === 'perDomain' && url) {
    try {
      const domain = new URL(url).host;
      const existing = state.uaPerDomain.get(domain);
      if (existing) return existing;
      const ua = pick(pool);
      state.uaPerDomain.set(domain, ua);
      return ua;
    } catch {}
  }
  return pick(pool);
}

export async function applyHeaders(
  page: Page,
  config: PolitenessConfig,
  state: PolitenessState,
  url?: string
) {
  if (!config.userAgent.enabled) return;
  const ua = computeUA(config, state, url);
  await page.setUserAgent(ua);
  const headers: Record<string, string> = {};
  if (config.userAgent.acceptLanguageRandomization) {
    headers['accept-language'] = pick(ACCEPT_LANGUAGE_POOL);
  }
  if (config.userAgent.headers) {
    for (const k of Object.keys(config.userAgent.headers)) {
      headers[k.toLowerCase()] = config.userAgent.headers[k];
    }
  }
  if (Object.keys(headers).length > 0) {
    await page.setExtraHTTPHeaders(headers);
  }
  return ua;
}
