# Deployment and Monitoring

## Deployment

- Apply Prisma migration to add `CredentialAudit`.
- Run client generation.
- Ensure `LOG_SECURE_ENABLED=true` and set `LOG_HASH_KEY`.

## Verification

- Emit sample logs containing emails, tokens, cards, SSNs; confirm masks and fingerprints.
- Execute a workflow requiring credentials; verify audit rows created.

## Monitoring

- Dashboards: audit outcomes, volume per requester/method, failure rates.
- Alerts: threshold-based on failure spikes and missing fingerprints.

## Performance

- Sanitizer throughput tested with 10k lines under 2s in CI.

## API Access Controls

- Public endpoints:
  - `GET /sign-in*`
  - `GET /sign-up*`
  - `POST /api/webhooks/stripe` (Stripe signature verified)
- Restricted endpoints:
  - `GET /api/workflows/execute` requires `Authorization: Bearer <API_SECRET>` or an authenticated Clerk session; handlers still enforce bearer validation and rate limits.
  - `GET /api/workflows/cron` requires `Authorization: Bearer <API_SECRET>` or an authenticated Clerk session; rate limits applied.
