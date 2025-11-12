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

