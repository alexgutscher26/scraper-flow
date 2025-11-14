import { describe, it, expect } from 'vitest';
import { isAllowed, parseRobots } from '../../lib/politeness/robots';
import { PolitenessState } from '../../types/politeness';
import { defaultPolitenessConfig } from '../../types/politeness';

describe('robots isAllowed', () => {
  it('allows when robots disabled', async () => {
    const cfg = defaultPolitenessConfig();
    cfg.robots.enabled = false;
    const st: PolitenessState = { robotsCache: new Map(), uaPerDomain: new Map() } as any;
    const ok = await isAllowed('https://example.com/a', cfg, st, 'Mozilla/5.0');
    expect(ok).toBe(true);
  });

  it('blocks disallowed path', async () => {
    const content = ['User-agent: *', 'Disallow: /private', 'Allow: /'].join('\n');
    const cfg = defaultPolitenessConfig();
    cfg.robots.enabled = true;
    const st: PolitenessState = { robotsCache: new Map(), uaPerDomain: new Map() } as any;
    st.robotsCache.set('example.com', parseRobots(content));
    const ok = await isAllowed('https://example.com/private/data', cfg, st, 'Mozilla/5.0');
    expect(ok).toBe(false);
  });

  it('allows other path', async () => {
    const content = ['User-agent: *', 'Disallow: /private'].join('\n');
    const cfg = defaultPolitenessConfig();
    cfg.robots.enabled = true;
    const st: PolitenessState = { robotsCache: new Map(), uaPerDomain: new Map() } as any;
    st.robotsCache.set('example.com', parseRobots(content));
    const ok = await isAllowed('https://example.com/public', cfg, st, 'Mozilla/5.0');
    expect(ok).toBe(true);
  });
});
