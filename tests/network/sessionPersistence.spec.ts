import { describe, it, expect } from 'vitest';
import { SessionManager } from '@/lib/network/cookieJar';

function headers(setCookies: string[]): Headers {
  const h = new Headers();
  // join into a single header to exercise parser
  h.set('set-cookie', setCookies.join(', '));
  return h;
}

describe('SessionManager persistence', () => {
  it('captures and attaches cookies respecting domain/path', () => {
    const sm = new SessionManager(1000);
    sm.captureFromResponse(
      'https://a.example/app',
      headers(['sid=abc; Path=/app; HttpOnly', 'pref=1; Domain=.example; Path=/; SameSite=Lax'])
    );
    const init: any = { headers: {} };
    sm.attachToRequest('https://a.example/app/index', init);
    const cookie = init.headers['Cookie'] || init.headers['cookie'];
    expect(cookie).toContain('sid=abc');
    expect(cookie).toContain('pref=1');
  });

  it('expires by TTL and renew resets jar', async () => {
    const sm = new SessionManager(1);
    expect(sm.isExpired()).toBe(false);
    await new Promise((r) => setTimeout(r, 5));
    expect(sm.isExpired()).toBe(true);
    sm.renew();
    expect(sm.isExpired()).toBe(false);
  });
});
