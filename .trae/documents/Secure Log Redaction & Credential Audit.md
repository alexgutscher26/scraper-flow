## Overview

* Implement automatic, irreversible masking/redaction across all logs: application, system (console), and audit.

* Detect and handle credentials, PII, financial data, and PHI; preserve original length/format when practical; add non-reversible fingerprints for correlation.

* Add comprehensive credential access audit logging with required fields.

## Current Integration Points

* Core logger and collector: `lib/log.ts:9–28,54–75`.

* Log type definitions: `types/log.ts:1–16`.

* Log persistence: `lib/workflow/executionWorkflow.ts:262–269`.

* Credential resolution: `lib/credential/getCredentialValue.ts:11–34,39–63`.

* Residual server console usage: `app/api/webhooks/stripe/route.ts:10,27–43`.

## Redaction Engine

* Create `lib/logSecure/sanitizer.ts` with modular detectors and transformers:

  * Credentials: keys named `password`, `secret`, `token`, `apiKey`, `clientSecret`; headers like `Authorization`, `X-API-Key`; JWT-like tokens.

  * PII: emails, phone numbers (E.164 and common formats), SSN (`\b\d{3}-\d{2}-\d{4}\b`), postal addresses (basic patterns), names via configurable allowlist of keys.

  * Financial: credit cards (Luhn validation; keep last 4, preserve grouping), IBAN, bank routing/account patterns.

  * PHI: MRN (common 6–10 digit patterns when keyed by `mrn`), ICD codes (e.g., `^[A-TV-Z][0-9][A-Z0-9]`), Rx numbers; list driven by key names.

* Masking rules:

  * Replace characters with `*` while retaining delimiters/grouping; emails keep domain (`j*****@domain.com`); tokens keep short prefix (`tok_` or first 4) and length; SSN `***-**-1234`.

  * Provide `sanitizeString`, `sanitizeObject` recursive functions; attempt format-preserving masking for common patterns.

* Irreversible fingerprinting:

  * Compute HMAC-SHA256 using `LOG_HASH_KEY` for each detected value; include short fingerprint in logs like `[fp: a1b2c3d4]` for correlation without storing raw.

  * If `LOG_HASH_KEY` missing, fallback to SHA-256 with strong warning in docs; never store plaintext.

## Logger Changes

* Update `createLogger` (`lib/log.ts:54–75`):

  * Sanitize input message (string or JSON) before formatting, console output, and collector forwarding.

  * Accept objects; stringify via `sanitizeObject` then `JSON.stringify` to preserve searchability of non-sensitive fields.

* Update `createLogCollector` (`lib/log.ts:9–28`):

  * Sanitize before pushing into in-memory collector.

* Add `initSecureConsole()` (server-only):

  * Wrap `console.log|warn|error` to pass strings/objects through the sanitizer; ensure timestamp and scope preservation.

  * Initialize in API route modules and long-lived server contexts.

## Apply Consistent Masking Across Persistence

* Ensure logs persisted in `finalizePhase` (`lib/workflow/executionWorkflow.ts:262–269`) are already sanitized.

* Sanitize `serializableOutputs` before `JSON.stringify` to avoid sensitive outputs leakage (`lib/workflow/executionWorkflow.ts:255–273`).

## Credential Access Audit Logging

* Prisma model `CredentialAudit`:

  * Fields: `id`, `timestamp`, `userId`, `credentialId`, `credentialName`, `credentialType`, `requester` (user/app/service id), `method` (e.g., `workflow-executor`, `api`), `outcome` (`success|failure`), `correlationId` (executionId/phaseId when available), `fingerprint` (HMAC of accessed value), `errorMessage?`.

  * Indexes: `(userId,timestamp)`, `credentialId`, `outcome`.

* Implement `logCredentialAccess(audit)` in `lib/credential/audit.ts` and call from:

  * `getCredentialValue` (`lib/credential/getCredentialValue.ts:11–34`) for both success and failure.

  * `getCredentialValueByName` (`lib/credential/getCredentialValue.ts:39–63`) similarly.

* Propagate context:

  * Add optional `context` param (e.g., `"workflow/executor/<TaskType>"`) from `setupEnvironmentForPhase` (`lib/workflow/executionWorkflow.ts:339–349`).

## Residual Console Usage Refactor

* Replace server-side `console.*` in Stripe webhook with scoped logger (`app/api/webhooks/stripe/route.ts:10,27–43`).

* Optionally leave client-side `console.*` but provide `initSecureConsole()` that can be enabled in the browser for sensitive pages.

## Configuration

* Env vars:

  * `LOG_SECURE_ENABLED=true` to activate sanitization globally.

  * `LOG_HASH_KEY` for HMAC.

  * `LOG_LEVEL` already supported (`lib/log.ts:36–41`).

* Feature flags: allow per-scope whitelist/blacklist for keys and patterns via config object.

## Testing

* Unit tests (Vitest):

  * Pattern detection and masking for credentials, PII, financial, PHI.

  * Format-preserving checks (length/grouping unchanged where applicable).

  * Hashing: fingerprints are stable for same input/key, cannot recover original.

  * Object sanitizer: nested structures, arrays, mixed types.

* Audit logging tests:

  * Successful and failed credential access events; all required fields captured; indexes usable.

* Performance tests:

  * Emit 100k mixed log lines; measure sanitizer throughput and overhead; assert < X ms per 1k lines on CI hardware.

## Deployment & Monitoring

* Prisma migration to add `CredentialAudit`.

* Rollout sequence:

  1. Ship sanitizer and logger changes behind `LOG_SECURE_ENABLED`.
  2. Migrate DB; enable audit logging.
  3. Refactor Stripe webhook logs; enable `initSecureConsole()` in API routes.

* Monitoring:

  * Dashboards for audit outcomes and volume; alerts on spikes and failures.

  * Spot-check redacted `ExecutionLog` samples for format correctness.

## Security & Policy Updates

* No plaintext sensitive data in logs; fingerprints only.

* Key management for `LOG_HASH_KEY`; rotate on schedule; document blast radius.

* Updated logging standards: mandate scoped logger usage; forbid raw `console.*` on server; require sanitizer for JSON outputs.

## Deliverables

* Implementation docs: sanitization strategy, patterns, hashing, limitations, performance, key management.

* Updated logging standards/policies document.

* Test cases (Vitest) and validation results.

* Deployment steps with Prisma migration and config; monitoring dashboards and alert runbooks.

