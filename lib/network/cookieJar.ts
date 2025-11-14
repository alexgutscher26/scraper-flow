type Cookie = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
};

/**
 * Parse a Set-Cookie header string into a Cookie object.
 *
 * The function splits the header into its components, extracts the name and value of the cookie,
 * and processes additional attributes such as domain, path, expires, max-age, secure, httponly,
 * and samesite. It constructs a Cookie object with the parsed values and returns it, or null if
 * the header is invalid.
 *
 * @param header - The Set-Cookie header string to parse.
 * @returns A Cookie object representing the parsed cookie, or null if the header is invalid.
 */
function parseSetCookie(header: string): Cookie | null {
  const parts = header.split(/;\s*/);
  const [nameValue, ...attrs] = parts;
  const eqIdx = nameValue.indexOf('=');
  if (eqIdx < 0) return null;
  const name = nameValue.slice(0, eqIdx).trim();
  const value = nameValue.slice(eqIdx + 1);
  if (!name || /[\s;\u0000-\u001f\u007f]/.test(name)) return null;
  if (value.length > 4096) return null;
  const cookie: Cookie = { name, value };
  for (const a of attrs) {
    const [kRaw, vRaw] = a.split('=');
    const k = kRaw.trim().toLowerCase();
    const v = vRaw?.trim();
    if (k === 'domain' && v) cookie.domain = v.toLowerCase();
    else if (k === 'path' && v) cookie.path = v;
    else if (k === 'expires' && v) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) cookie.expires = d;
    } else if (k === 'max-age' && v) cookie.maxAge = Number(v);
    else if (k === 'secure') cookie.secure = true;
    else if (k === 'httponly') cookie.httpOnly = true;
    else if (k === 'samesite' && v) cookie.sameSite = v as any;
  }
  return cookie;
}

/**
 * Checks if the given host matches the specified cookie domain.
 *
 * The function first checks if cookieDomain is provided; if not, it returns true.
 * If cookieDomain starts with a dot, it removes the dot for comparison.
 * It then checks if the host is equal to the cookie domain or if the host ends with the cookie domain prefixed by a dot.
 *
 * @param host - The host to be checked against the cookie domain.
 * @param cookieDomain - The domain associated with the cookie, which may be optional.
 */
function domainMatches(host: string, cookieDomain?: string): boolean {
  if (!cookieDomain) return true;
  const cd = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
  return host === cd || host.endsWith('.' + cd);
}

function pathMatches(reqPath: string, cookiePath?: string): boolean {
  const p = cookiePath || '/';
  return reqPath.startsWith(p);
}

/**
 * Checks if a given cookie is expired.
 *
 * The function evaluates the expiration status of the cookie based on its `expires` property,
 * which is checked against the current time. If `expires` is not set, it checks the `maxAge`
 * property to determine if the cookie has a non-positive age, indicating expiration.
 * If neither condition is met, the cookie is considered not expired.
 *
 * @param c - The cookie object to check for expiration.
 */
function isExpired(c: Cookie): boolean {
  if (c.expires) return Date.now() > c.expires.getTime();
  if (typeof c.maxAge === 'number') return c.maxAge <= 0;
  return false;
}

export class CookieJar {
  private store = new Map<string, Cookie[]>(); // key by domain

  setCookies(setCookieHeaders: string[] | null | undefined, url: string): void {
    if (!setCookieHeaders || !setCookieHeaders.length) return;
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const arr = this.store.get(host) || [];
    for (const h of setCookieHeaders) {
      const parsed = parseSetCookie(h);
      if (!parsed) continue;
      if (parsed.secure && u.protocol !== 'https:') continue;
      const domain = (parsed.domain || host).toLowerCase();
      const existingIdx = arr.findIndex(
        (c) => c.name === parsed.name && (c.domain || host) === domain
      );
      if (existingIdx >= 0) arr.splice(existingIdx, 1);
      arr.push(parsed);
    }
    this.store.set(host, arr);
  }

  /**
   * Generate a cookie header string for a given URL.
   *
   * This function constructs a cookie header by iterating through stored cookies, checking their expiration, domain, path, and security attributes. It uses the URL object to extract the hostname and pathname, ensuring that only valid cookies are included in the final header string. If no valid cookies are found, it returns undefined.
   *
   * @param url - The URL for which the cookie header is to be generated.
   * @returns A string representing the cookie header, or undefined if no valid cookies are found.
   */
  cookieHeaderFor(url: string): string | undefined {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname || '/';
    const now = Date.now();
    const result: string[] = [];
    // search all domains in store; include those matching host
    for (const [d, arr] of this.store) {
      for (const c of arr) {
        if (c.expires && c.expires.getTime() < now) continue;
        if (!domainMatches(host, c.domain || d)) continue;
        if (!pathMatches(path, c.path)) continue;
        if (c.secure && u.protocol !== 'https:') continue;
        result.push(`${c.name}=${c.value}`);
      }
    }
    return result.length ? result.join('; ') : undefined;
  }

  toJSON(): any {
    const out: Record<string, Cookie[]> = {};
    for (const [k, v] of this.store) out[k] = v;
    return out;
  }

  /**
   * Loads data into the store.
   *
   * This function checks if the provided data is a valid object. If so, it clears the existing store and iterates over the keys of the data object. For each key, it determines if the corresponding value is an array; if not, it initializes an empty array. The key and its associated array are then stored in the store.
   *
   * @param data - The data to be loaded into the store, expected to be an object.
   */
  load(data: any): void {
    if (!data || typeof data !== 'object') return;
    this.store.clear();
    for (const k of Object.keys(data)) {
      const arr = Array.isArray(data[k]) ? data[k] : [];
      this.store.set(k, arr);
    }
  }
}

export class SessionManager {
  private jar = new CookieJar();
  private createdAt = Date.now();
  private ttlMs: number;

  constructor(ttlMs = 30 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  /**
   * Checks if the current instance has expired based on its creation time and TTL.
   */
  isExpired(): boolean {
    return Date.now() - this.createdAt > this.ttlMs;
  }
  /**
   * Resets the createdAt timestamp and initializes a new CookieJar.
   */
  renew(): void {
    this.createdAt = Date.now();
    this.jar = new CookieJar();
  }
  /** Returns the CookieJar instance. */
  jarRef(): CookieJar {
    return this.jar;
  }

  /**
   * Attaches the cookie header to the request initialization object.
   */
  attachToRequest(url: string, init: any): void {
    const header = this.jar.cookieHeaderFor(url);
    if (!header) return;
    init.headers = { ...(init.headers || {}), Cookie: header };
  }

  captureFromResponse(url: string, headers: Headers): void {
    const set = headers.get('set-cookie');
    const all: string[] = [];
    if (set) {
      // split multiple cookies if comma-separated with attributes handling (basic)
      const parts = set.split(/,(?=[^;]+=)/);
      for (const p of parts) all.push(p.trim());
    }
    this.jar.setCookies(all, url);
  }
}
