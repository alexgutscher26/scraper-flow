import { createHash } from 'crypto'

type IdempotencyRecord = {
  status: 'in_progress' | 'completed'
  value?: any
  expiresAt: number
}

type ReserveResult = { reserved: boolean; existing?: IdempotencyRecord }

const globalStore: Map<string, IdempotencyRecord> = (global as any).__idemStore || new Map()
;(global as any).__idemStore = globalStore

async function upstash<T = any>(cmd: (string | number | Record<string, any>)[]): Promise<T> {
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) throw new Error('upstash not configured')
  const res = await fetch(UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cmd }),
  })
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`)
  return (await res.json()) as T
}

async function getFromRedis(key: string): Promise<IdempotencyRecord | null> {
  try {
    const out = await upstash<{ result: string | null }>(['GET', key])
    if (!out.result) return null
    return JSON.parse(out.result)
  } catch {
    return null
  }
}

async function setNxRedis(key: string, value: IdempotencyRecord, ttlSec: number): Promise<boolean> {
  try {
    const out = await upstash<{ result: 'OK' | null }>(['SET', key, JSON.stringify(value), 'NX', 'EX', ttlSec])
    return out.result === 'OK'
  } catch {
    return false
  }
}

async function setRedis(key: string, value: IdempotencyRecord, ttlSec: number): Promise<boolean> {
  try {
    const out = await upstash<{ result: 'OK' | null }>(['SET', key, JSON.stringify(value), 'EX', ttlSec])
    return out.result === 'OK'
  } catch {
    return false
  }
}

export async function reserveIdempotencyKey(key: string, ttlSec: number): Promise<ReserveResult> {
  const now = Date.now()
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
  const record: IdempotencyRecord = { status: 'in_progress', expiresAt: now + ttlSec * 1000 }
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    const ok = await setNxRedis(key, record, ttlSec)
    if (ok) return { reserved: true }
    const existing = await getFromRedis(key)
    return { reserved: false, existing: existing || undefined }
  }
  const existing = globalStore.get(key)
  if (!existing || existing.expiresAt <= now) {
    globalStore.set(key, record)
    return { reserved: true }
  }
  return { reserved: false, existing }
}

export async function completeIdempotencyKey(key: string, value: any, ttlSec: number): Promise<void> {
  const now = Date.now()
  const record: IdempotencyRecord = { status: 'completed', value, expiresAt: now + ttlSec * 1000 }
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    await setRedis(key, record, ttlSec)
    return
  }
  globalStore.set(key, record)
}

export async function getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
  const now = Date.now()
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    return (await getFromRedis(key))
  }
  const rec = globalStore.get(key) || null
  if (rec && rec.expiresAt <= now) return null
  return rec
}

function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map((v) => stableStringify(v)).join(',') + ']'
  const keys = Object.keys(obj).sort()
  const entries = keys.map((k) => '"' + k + '":' + stableStringify(obj[k]))
  return '{' + entries.join(',') + '}'
}

export function fingerprint(obj: any): string {
  const json = typeof obj === 'string' ? obj : stableStringify(obj)
  return createHash('sha256').update(json).digest('hex')
}

export async function markOutputFingerprint(namespace: string, hash: string, ttlSec: number): Promise<boolean> {
  const key = `outfp:${namespace}:${hash}`
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
  const now = Date.now()
  const rec: IdempotencyRecord = { status: 'completed', expiresAt: now + ttlSec * 1000 }
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    const ok = await setNxRedis(key, rec, ttlSec)
    return ok
  }
  const existing = globalStore.get(key)
  if (!existing || existing.expiresAt <= now) {
    globalStore.set(key, rec)
    return true
  }
  return false
}

export async function hasOutputFingerprint(namespace: string, hash: string): Promise<boolean> {
  const key = `outfp:${namespace}:${hash}`
  const rec = await getIdempotencyRecord(key)
  return !!rec
}
