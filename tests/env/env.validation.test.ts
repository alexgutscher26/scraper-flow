import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnv } from '../../lib/env';

const originalEnv = { ...process.env };

function resetEnv() {
  process.env = { ...originalEnv } as any;
}

function setMinimalValidEnv() {
  process.env.API_SECRET = 'supersecret';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
  process.env.ENCRYPTION_SECRET = 'encryption_key_123';
  process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
}

describe('env validation', () => {
  beforeEach(() => {
    resetEnv();
  });
  afterEach(() => {
    resetEnv();
  });

  it('throws when API_SECRET is missing', () => {
    setMinimalValidEnv();
    delete process.env.API_SECRET;
    expect(() => getEnv()).toThrow(/Environment validation failed: .*API_SECRET/);
  });

  it('throws when STRIPE_SECRET_KEY is missing', () => {
    setMinimalValidEnv();
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => getEnv()).toThrow(/Environment validation failed: .*STRIPE_SECRET_KEY/);
  });

  it('throws when STRIPE_WEBHOOK_SECRET is missing', () => {
    setMinimalValidEnv();
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(() => getEnv()).toThrow(/Environment validation failed: .*STRIPE_WEBHOOK_SECRET/);
  });

  it('throws when ENCRYPTION_SECRET is missing', () => {
    setMinimalValidEnv();
    delete process.env.ENCRYPTION_SECRET;
    expect(() => getEnv()).toThrow(/Environment validation failed: .*ENCRYPTION_SECRET/);
  });

  it('throws when NEXT_PUBLIC_APP_URL is invalid', () => {
    setMinimalValidEnv();
    process.env.NEXT_PUBLIC_APP_URL = 'not-a-url';
    expect(() => getEnv()).toThrow(/must be a valid URL/);
  });

  it('returns typed env when valid', () => {
    setMinimalValidEnv();
    const env = getEnv();
    expect(env.API_SECRET).toBe('supersecret');
    expect(env.STRIPE_SECRET_KEY).toContain('sk_');
    expect(env.NEXT_PUBLIC_APP_URL).toMatch(/^https:\/\//);
  });
});
