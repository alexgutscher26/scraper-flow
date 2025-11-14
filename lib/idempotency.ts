import { createHash } from 'crypto'

type IdempotencyRecord = {
  status: 'in_progress' | 'completed'
  value?: any
  expiresAt: number
}

type ReserveResult = { reserved: boolean; existing?: IdempotencyRecord }

const globalStore: Map<string, IdempotencyRecord> = (global as any).__idemStore || new Map()
;(global as any).__idemStore = globalStore

/**
 * Executes a command against the Upstash Redis REST API.
 *
 * This function retrieves the Upstash Redis REST URL and token from environment variables.
 * It throws an error if either is not configured. The command is sent as a POST request,
 * and the response is returned as a parsed JSON object. If the response is not successful,
 * an error is thrown with the response status.
 *
 * @param cmd - An array of commands to be executed, which can be strings, numbers, or objects.
 */
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

/**
 * Retrieves an IdempotencyRecord from Redis using the specified key.
 *
 * The function attempts to fetch the value associated with the provided key from Redis.
 * If the value is found, it parses the JSON string and returns the corresponding IdempotencyRecord.
 * If the key does not exist or an error occurs during the fetch operation, it returns null.
 *
 * @param key - The key used to retrieve the value from Redis.
 */
async function getFromRedis(key: string): Promise<IdempotencyRecord | null> {
  try {
    const out = await upstash<{ result: string | null }>(['GET', key])
    if (!out.result) return null
    return JSON.parse(out.result)
  } catch {
    return null
  }
}

/**
 * Sets a key in Redis with a value if the key does not already exist.
 *
 * This function attempts to store a JSON stringified version of the provided value
 * in Redis using the SET command with NX (only set if not exists) and an expiration
 * time defined by ttlSec. If the operation is successful and the result is 'OK',
 * it returns true; otherwise, it returns false in case of an error or if the key
 * already exists.
 *
 * @param key - The Redis key to set.
 * @param value - The value to store, represented as an IdempotencyRecord.
 * @param ttlSec - The time-to-live for the key in seconds.
 */
async function setNxRedis(key: string, value: IdempotencyRecord, ttlSec: number): Promise<boolean> {
  try {
    const out = await upstash<{ result: 'OK' | null }>(['SET', key, JSON.stringify(value), 'NX', 'EX', ttlSec])
    return out.result === 'OK'
  } catch {
    return false
  }
}

/**
 * Sets a value in Redis with a specified key and time-to-live.
 *
 * This function attempts to store a JSON stringified version of the provided value
 * in Redis using the specified key. It utilizes the upstash function to perform the
 * operation and checks if the result indicates success. If an error occurs during
 * the operation, it returns false.
 *
 * @param key - The key under which the value will be stored in Redis.
 * @param value - The value to be stored, represented as an IdempotencyRecord.
 * @param ttlSec - The time-to-live for the key in seconds.
 */
async function setRedis(key: string, value: IdempotencyRecord, ttlSec: number): Promise<boolean> {
  try {
    const out = await upstash<{ result: 'OK' | null }>(['SET', key, JSON.stringify(value), 'EX', ttlSec])
    return out.result === 'OK'
  } catch {
    return false
  }
}

/**
 * Reserve an idempotency key for a specified time-to-live (TTL).
 *
 * This function checks for the presence of UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to determine if it should use Redis for storage.
 * If Redis is available, it attempts to set the key with a record indicating it is in progress. If the key already exists, it retrieves the existing record.
 * If Redis is not available, it falls back to a global store, checking if the key is expired before reserving it.
 *
 * @param key - The idempotency key to reserve.
 * @param ttlSec - The time-to-live in seconds for the key.
 * @returns A promise that resolves to a ReserveResult indicating whether the key was reserved and any existing record.
 */
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

/**
 * Completes the idempotency key by storing the associated value and expiration time.
 *
 * This function creates an IdempotencyRecord with a status of 'completed', the provided value,
 * and an expiration time calculated from the current time and the specified ttlSec. It checks
 * for the presence of UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to determine
 * whether to store the record in Redis or in a global store.
 *
 * @param key - The idempotency key to be completed.
 * @param value - The value to associate with the idempotency key.
 * @param ttlSec - The time-to-live in seconds for the idempotency record.
 */
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

/**
 * Retrieves an idempotency record based on the provided key.
 *
 * The function first checks for the presence of UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in the environment variables.
 * If both are available, it attempts to fetch the record from Redis using the getFromRedis function.
 * If not, it checks the globalStore for a record associated with the key, ensuring that it has not expired before returning it.
 *
 * @param {string} key - The key associated with the idempotency record to retrieve.
 */
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

/**
 * Converts a JavaScript object or value to a JSON string in a stable manner.
 *
 * The function checks if the input is null or not an object, in which case it returns the JSON string directly.
 * If the input is an array, it recursively stringifies each element. For objects, it sorts the keys and
 * recursively stringifies each key-value pair to ensure a consistent order in the output.
 *
 * @param obj - The object or value to be stringified.
 */
function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map((v) => stableStringify(v)).join(',') + ']'
  const keys = Object.keys(obj).sort()
  const entries = keys.map((k) => '"' + k + '":' + stableStringify(obj[k]))
  return '{' + entries.join(',') + '}'
}

/**
 * Generates a SHA-256 hash fingerprint for the given object.
 */
export function fingerprint(obj: any): string {
  const json = typeof obj === 'string' ? obj : stableStringify(obj)
  return createHash('sha256').update(json).digest('hex')
}

/**
 * Marks the output fingerprint for a given namespace and hash.
 *
 * This function attempts to store an idempotency record in a Redis store if the necessary environment variables are set.
 * If the Redis store is not available, it falls back to a global store. The record includes a status and an expiration time
 * based on the provided ttlSec. If a record already exists and is still valid, the function will return false.
 *
 * @param namespace - The namespace under which the fingerprint is stored.
 * @param hash - The unique hash associated with the output fingerprint.
 * @param ttlSec - The time-to-live in seconds for the fingerprint record.
 */
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

/**
 * Checks if an output fingerprint exists for the given namespace and hash.
 */
export async function hasOutputFingerprint(namespace: string, hash: string): Promise<boolean> {
  const key = `outfp:${namespace}:${hash}`
  const rec = await getIdempotencyRecord(key)
  return !!rec
}
