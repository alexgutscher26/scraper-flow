type Cookie = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
};

/**
 * Parse a Set-Cookie header string into a Cookie object.
 *
 * The function splits the header into its components, extracts the name and value of the cookie, and validates them.
 * It then processes additional attributes such as domain, path, expires, max-age, secure, httponly, and samesite,
 * updating the cookie object accordingly. If any validation fails, it returns null.
 *
 * @param header - The Set-Cookie header string to parse.
 * @returns A Cookie object representing the parsed cookie, or null if parsing fails.
 */
function parseSetCookie(header: string): Cookie | null {
  const parts = header.split(/;\s*/);
  const [nameValue, ...attrs] = parts;
  const eqIdx = nameValue.indexOf("=");
  if (eqIdx < 0) return null;
  const name = nameValue.slice(0, eqIdx).trim();
  const value = nameValue.slice(eqIdx + 1);
  if (!name || /[\s;\u0000-\u001f\u007f]/.test(name)) return null;
  if (value.length > 4096) return null;
  const cookie: Cookie = { name, value };
  for (const a of attrs) {
    const [kRaw, vRaw] = a.split("=");
    const k = kRaw.trim().toLowerCase();
    const v = vRaw?.trim();
    if (k === "domain" && v) cookie.domain = v.toLowerCase();
    else if (k === "path" && v) cookie.path = v;
    else if (k === "expires" && v) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) cookie.expires = d;
    } else if (k === "max-age" && v) cookie.maxAge = Number(v);
    else if (k === "secure") cookie.secure = true;
    else if (k === "httponly") cookie.httpOnly = true;
    else if (k === "samesite" && v) cookie.sameSite = v as any;
  }
  return cookie;
}

function domainMatches(host: string, cookieDomain?: string): boolean {
  if (!cookieDomain) return true;
  const cd = cookieDomain.startsWith(".") ? cookieDomain.slice(1) : cookieDomain;
  return host === cd || host.endsWith("." + cd);
}

function pathMatches(reqPath: string, cookiePath?: string): boolean {
  const p = cookiePath || "/";
  return reqPath.startsWith(p);
}

function isExpired(c: Cookie): boolean {
  if (c.expires) return Date.now() > c.expires.getTime();
  if (typeof c.maxAge === "number") return c.maxAge <= 0;
  return false;
}

export class CookieJar {
  private store = new Map<string, Cookie[]>(); // key by domain

  /**
   * Sets cookies based on the provided headers and URL.
   *
   * The function first checks if the setCookieHeaders are valid. It then parses each header, ensuring that secure cookies are only set for HTTPS URLs. It manages existing cookies by removing duplicates based on name and domain before adding the new parsed cookies to the store associated with the host.
   *
   * @param setCookieHeaders - An array of set-cookie headers to be processed.
   * @param url - The URL to which the cookies will be associated.
   * @returns void
   */
  setCookies(setCookieHeaders: string[] | null | undefined, url: string): void {
    if (!setCookieHeaders || !setCookieHeaders.length) return;
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const arr = this.store.get(host) || [];
    for (const h of setCookieHeaders) {
      const parsed = parseSetCookie(h);
      if (!parsed) continue;
      if (parsed.secure && u.protocol !== "https:") continue;
      const domain = (parsed.domain || host).toLowerCase();
      const existingIdx = arr.findIndex(c => c.name === parsed.name && (c.domain || host) === domain);
      if (existingIdx >= 0) arr.splice(existingIdx, 1);
      arr.push(parsed);
    }
    this.store.set(host, arr);
  }

  cookieHeaderFor(url: string): string | undefined {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname || "/";
    const now = Date.now();
    const result: string[] = [];
    // search all domains in store; include those matching host
    for (const [d, arr] of this.store) {
      for (const c of arr) {
        if (c.expires && c.expires.getTime() < now) continue;
        if (!domainMatches(host, c.domain || d)) continue;
        if (!pathMatches(path, c.path)) continue;
        if (c.secure && u.protocol !== "https:") continue;
        result.push(`${c.name}=${c.value}`);
      }
    }
    return result.length ? result.join("; ") : undefined;
  }

  toJSON(): any {
    const out: Record<string, Cookie[]> = {};
    for (const [k, v] of this.store) out[k] = v;
    return out;
  }

  load(data: any): void {
    if (!data || typeof data !== "object") return;
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

  constructor(ttlMs = 30 * 60 * 1000) { this.ttlMs = ttlMs; }

  isExpired(): boolean { return Date.now() - this.createdAt > this.ttlMs; }
  renew(): void { this.createdAt = Date.now(); this.jar = new CookieJar(); }
  jarRef(): CookieJar { return this.jar; }

  attachToRequest(url: string, init: any): void {
    const header = this.jar.cookieHeaderFor(url);
    if (!header) return;
    init.headers = { ...(init.headers || {}), Cookie: header };
  }

  captureFromResponse(url: string, headers: Headers): void {
    const set = headers.get("set-cookie");
    const all: string[] = [];
    if (set) {
      // split multiple cookies if comma-separated with attributes handling (basic)
      const parts = set.split(/,(?=[^;]+=)/);
      for (const p of parts) all.push(p.trim());
    }
    this.jar.setCookies(all, url);
  }
}
