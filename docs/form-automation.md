# Form Automation Improvements

## File Upload

- Inputs: `Selector`, `Files`, `AcceptTypes`, `MaxSizeMB`, `UseDragAndDrop`, `DropTargetSelector`, `StrictMode`.
- Validation: size and type checks; when `StrictMode` is on, executor fails on first invalid file; off, invalid files are skipped and errors logged.
- Outputs: `UploadedFiles`, `UploadedCount`, `UploadProgress`, `ErrorMessage`, `Success`.
- UI: client-side validation for `Files` list and `AcceptTypes` regex.

## Captcha Providers

- Providers: reCAPTCHA and hCaptcha detection via page HTML.
- Inputs: `CaptchaCredential` (provider secret), `SecurityLevel`, `CaptchaType` (auto/visible/invisible).
- Token extraction: attempts to read token from hidden inputs or `grecaptcha.execute` for invisible reCAPTCHA.
- Verification: server-side verification with provider endpoints using secret from `CaptchaCredential`.
- Outputs: `Provider`, `Token`, `CaptchaSolved`, `VerificationPassed`.

## Two-Factor Authentication (2FA)

- Credential type: `two_factor` supporting methods `totp`, `sms`, `email`.
- Secure storage: secrets encrypted; recovery codes hashed (SHA-256) and encrypted.
- Server action: `VerifyTwoFactor` verifies TOTP codes and consumes recovery codes.
- Utilities: `lib/credential/totp.ts` for TOTP generation/verification; `lib/credential/recovery.ts` for recovery code generation/hashing.

## Testing

- Unit tests for upload progress/strict mode, TOTP generation/verification, recovery codes, captcha detection/verification.
- Integration test chaining upload and captcha verification.

## Configuration

- Provide captcha provider secret via a credential (API Key type or custom with `secret`).
- No external solver integration included; token extraction relies on page token availability.
