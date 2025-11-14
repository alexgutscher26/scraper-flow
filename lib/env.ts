import { z } from 'zod';

const EnvSchema = z.object({
  API_SECRET: z.string().min(1, 'API_SECRET is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  ENCRYPTION_SECRET: z.string().min(1, 'ENCRYPTION_SECRET is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  RATE_LIMIT_WINDOW_SECONDS: z.string().optional().default('60'),
  RATE_LIMIT_GLOBAL_CRON: z.string().optional().default('20'),
  RATE_LIMIT_USER_CRON: z.string().optional().default('10'),
  RATE_LIMIT_GLOBAL_EXECUTE: z.string().optional().default('120'),
  RATE_LIMIT_USER_EXECUTE: z.string().optional().default('60'),
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;
let lastError: Error | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join('.') || 'env'}: ${i.message}`)
      .join('; ');
    const err = new Error(`Environment validation failed: ${msg}`);
    lastError = err;
    throw err;
  }
  cachedEnv = parsed.data;
  lastError = null;
  return cachedEnv;
}

export function validateEnvOnStartup() {
  try {
    getEnv();
  } catch {}
}

export function getEnvValidationError(): Error | null {
  return lastError;
}

export function formatEnvError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

validateEnvOnStartup();
