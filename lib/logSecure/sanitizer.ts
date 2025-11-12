import crypto from "crypto";

type Redaction = { masked: string; fingerprint?: string };

const emailRegex = /\b([A-Za-z0-9._%+-])([A-Za-z0-9._%+-]*?)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;
const phoneRegex = /\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}|\d{10})\b/g;
const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
const jwtRegex = /\b([A-Za-z0-9-_]{10,})\.([A-Za-z0-9-_]{10,})\.([A-Za-z0-9-_]{10,})\b/g;
const apiKeyRegex = /\b(?:api[_-]?key|x[-_]api[-_]key|authorization|bearer|token|secret|client[-_]secret)\b[^\n]*?(:|=)\s*([^\s,'";]+)/gi;
const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/g;
const mrnRegex = /\b(?:mrn|medical_record_number)\b[^\n]*?(:|=)\s*(\d{6,10})/gi;
const icdRegex = /\b([A-TV-Z][0-9][A-Z0-9](?:\.?[A-Z0-9]{0,4})?)\b/g;

function hmac(input: string): string {
  const key = process.env.LOG_HASH_KEY || "";
  const h = key
    ? crypto.createHmac("sha256", key).update(input).digest("hex")
    : crypto.createHash("sha256").update(input).digest("hex");
  return h.slice(0, 12);
}

function luhn(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function maskPreserveGroups(input: string, visibleSuffix = 4): Redaction {
  const groups = input.match(/\d+|\D+/g) || [input];
  let digitsSeen = 0;
  const totalDigits = (input.match(/\d/g) || []).length;
  const keep = Math.min(visibleSuffix, totalDigits);
  const res = groups
    .map((g) => {
      if (!/\d/.test(g)) return g.replace(/[^\s]/g, (c) => c);
      return g
        .split("")
        .map((ch) => {
          if (!/\d/.test(ch)) return ch;
          const remaining = totalDigits - digitsSeen;
          const show = remaining <= keep;
          digitsSeen++;
          return show ? ch : "*";
        })
        .join("");
    })
    .join("");
  return { masked: res, fingerprint: hmac(input) };
}

function redactEmail(match: string, first: string, rest: string, domain: string): string {
  const maskedLocal = `${first}${rest.replace(/./g, "*")}`;
  const fp = hmac(match);
  return `${maskedLocal}@${domain} [fp:${fp}]`;
}

function redactSSN(match: string): string {
  const suffix = match.slice(-4);
  const masked = `***-**-${suffix}`;
  const fp = hmac(match);
  return `${masked} [fp:${fp}]`;
}

function redactJWT(match: string): string {
  const parts = match.split(".");
  const masked = `${parts[0].slice(0, 4)}***.${parts[1].slice(0, 4)}***.${parts[2].slice(0, 4)}***`;
  const fp = hmac(match);
  return `${masked} [fp:${fp}]`;
}

function redactKeyPair(_: string, __: string, value: string): string {
  const fp = hmac(value);
  const masked = value.length <= 8 ? "*".repeat(value.length) : `${value.slice(0, 4)}${"*".repeat(Math.max(0, value.length - 8))}${value.slice(-4)}`;
  return `${masked} [fp:${fp}]`;
}

export function sanitizeString(input: string): string {
  let s = input;
  s = s.replace(emailRegex, redactEmail as any);
  s = s.replace(ssnRegex, (m) => redactSSN(m));
  s = s.replace(jwtRegex, (m) => redactJWT(m));
  s = s.replace(apiKeyRegex, (m, k, v) => m.replace(v, redactKeyPair(m, k, v)));
  s = s.replace(ibanRegex, (m) => {
    const r = maskPreserveGroups(m);
    return `${r.masked} [fp:${r.fingerprint}]`;
  });
  s = s.replace(mrnRegex, (m, k, v) => m.replace(v, (() => {
    const fp = hmac(v);
    const masked = `${"*".repeat(Math.max(0, v.length - 2))}${v.slice(-2)}`;
    return `${masked} [fp:${fp}]`;
  })()));
  s = s.replace(phoneRegex, (m) => {
    const digits = m.replace(/\D/g, "");
    if (digits.length < 10) return m;
    const r = maskPreserveGroups(m);
    return `${r.masked} [fp:${r.fingerprint}]`;
  });
  s = s.replace(/\b\d{12,19}\b/g, (m) => {
    if (!luhn(m)) return m;
    const r = maskPreserveGroups(m);
    return `${r.masked} [fp:${r.fingerprint}]`;
  });
  return s;
}

export function sanitizeObject(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => sanitizeObject(v));
  const out: Record<string, any> = {};
  for (const k of Object.keys(value)) {
    const v = (value as any)[k];
    const keySensitive = /password|secret|token|api[-_]?key|authorization|mrn|ssn|account|iban|routing/i.test(k);
    if (typeof v === "string") out[k] = keySensitive ? sanitizeString(v) : sanitizeString(v);
    else out[k] = sanitizeObject(v);
  }
  return out;
}

