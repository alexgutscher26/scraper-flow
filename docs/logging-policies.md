# Logging Standards and Policies

## Requirements

- Use `createLogger` for server logging; avoid raw `console.*`.
- Never log plaintext credentials, PII, financial data, or PHI.
- Store only masked values with fingerprints when necessary for correlation.

## Practices

- Prefer structured messages with clear, non-sensitive context.
- Include correlation identifiers (executionId, phaseId) where relevant.
- Sanitize any serialized objects before persistence.

## Audit Logging

- Record every credential access with timestamp, requester, method, outcome, and fingerprint.
- Investigate spikes in failures; alert on outliers.

## Configuration

- `LOG_SECURE_ENABLED` controls sanitizer activation.
- `LOG_HASH_KEY` provides HMAC secret.
