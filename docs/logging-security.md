# Logging Security Implementation

## Scope

- Automatic masking/redaction of credentials, PII, financial data, and PHI across application, system, and audit logs.
- Irreversible fingerprints via HMAC-SHA256 for correlation without storing raw values.

## Redaction

- Email: local part masked, domain preserved; includes fingerprint.
- Tokens/JWT: partial prefix preserved; includes fingerprint.
- Credit cards: Luhn-validated; last 4 digits preserved; grouping retained; includes fingerprint.
- SSN: `***-**-####` with fingerprint.
- Phone/IBAN/MRN/ICD: format-preserving masks; includes fingerprint.

## Hashing

- Uses `LOG_HASH_KEY` for HMAC-SHA256; fallback to SHA-256 if unset.
- Fingerprints truncated to 12–24 hex chars to balance uniqueness and brevity.

## Consistency

- Sanitization applied in `createLogger` and `createLogCollector` before console output and persistence.
- Global secure console wrapper initialized when `LOG_SECURE_ENABLED` is not `false`.
- Workflow outputs sanitized prior to serialization.

## Limitations

- Browser `page.evaluate` console output is not intercepted.
- Address detection uses heuristic patterns; extendable via code.

## Key Management

- Store `LOG_HASH_KEY` securely; rotate periodically; monitor fingerprint drift after rotation.
