## Overview
- Add robust executors for typing, selection, and file uploads, plus a modular captcha strategy aligned with existing workflow engine, logging, and politeness model.
- Keep idiomatic placement: executors in `lib/workflow/executor`, tasks in `lib/workflow/task`, register in `lib/workflow/executor/registry.ts`.
- Adhere to execution environment (`types/executor.ts:21-33`) and logging conventions used by current executors.

## Reference Architecture
- Executor registry: `lib/workflow/executor/registry.ts:36-58` connects `TaskType` → executor function.
- Existing input typing (to be enhanced): `lib/workflow/executor/FillInputExecutor.ts:4-22`.
- Politeness delay utilities: `lib/politeness/delay.ts:14-32` and phase delays: `lib/workflow/executionWorkflow.ts:500-507`.
- Browser bootstrap: `lib/workflow/executor/LaunchBrowserExecutor.ts:12-89` for environment and UA/robots handling.
- Phase environment builder: `lib/workflow/executionWorkflow.ts:375-395`.

## Type Executor (Enhanced)
- Replace current simple typing with a comprehensive executor:
  - Inputs: `Selector` (required), `Value` (required), `Type` (`text|number|email|password|tel|url|search|date|time|datetime-local`), `DebounceMs` (default 50), `ValidatePattern` (optional, regex), `MaxLength` (optional), `ClearBeforeType` (bool), `PressEnter` (bool).
  - Behavior:
    - Wait for element visible (`WaitForElementExecutor` style) and validate input `type` via `page.$eval` attribute.
    - Optional `clear` by select-all + `Delete`.
    - Debouncing: batch keystrokes using a buffered strategy (setTimeout-based between chunks) while keeping total under 100ms where possible.
    - Validation: client-side prechecks (pattern/maxlength) and post-type verification via `evaluate` reading `.value`.
    - Error handling: structured logs with reasons, return `false` on failure.
    - Politeness-aware: do not add extra delay beyond configured network tasks to meet sub-100ms response target.
  - Outputs: `TypedValue` (string), `Success` (boolean).
  - Placement: `lib/workflow/executor/TypeExecutor.ts` (or enhance `FillInputExecutor`) and task `lib/workflow/task/TypeInput.tsx`.
  - Registry: add to `lib/workflow/executor/registry.ts` under new `TaskType.TYPE_INPUT` (extend enum).

## Select Executor
- Support native `<select>` and custom dropdowns (ARIA, Radix, div-based components):
  - Inputs: `Selector` (container or select element), `Mode` (`single|multiple`), `Value(s)` (string|string[]), `SearchQuery` (optional), `UseKeyboard` (bool), `OptionFilter` (optional regex or predicate string), `OpenTriggerSelector` (optional for custom dropdown), `OptionSelector` (optional).
  - Behavior:
    - Native select: use `page.select(selector, ...values)` after visibility wait; validate final `value/selectedOptions`.
    - Custom dropdown:
      - Open dropdown via `click` on `OpenTriggerSelector` or the element itself.
      - Optional search: focus search input and type query (uses Type Executor) to filter.
      - Option filtering: in `evaluate`, find options matching `OptionFilter` or exact text; click them.
      - Keyboard navigation: if `UseKeyboard`, send `ArrowDown/ArrowUp` and `Enter` to reach target; support `Shift` for ranges in multiple mode.
    - Error handling and logs per step.
  - Outputs: `SelectedValues` (string[]), `Success` (boolean).
  - Placement: `lib/workflow/executor/SelectExecutor.ts`, task `lib/workflow/task/SelectOption.tsx`.
  - Registry: add `TaskType.SELECT_OPTION`.

## Upload Executor
- File input handling with validation, progress events, and drag-and-drop:
  - Inputs: `Selector` (file input or dropzone), `Files` (string[] of absolute paths), `AcceptTypes` (mime/extensions), `MaxSizeMB` (number), `UseDragAndDrop` (bool), `DropTargetSelector` (optional).
  - Validation:
    - Pre-validate existence, size, and type with Node APIs before attaching; size computed client-side to avoid attaching invalid files.
  - Behavior:
    - If `UseDragAndDrop`: simulate events via `page.evaluate` (`dragenter`, `dragover`, `drop`) and attach files by setting `DataTransfer` on hidden input; fall back to direct `setInputFiles`.
    - Standard upload: `const handle = await page.$(selector); await handle.setInputFiles(files)`.
    - Progress tracking: emit staged progress via logs and optional callbacks (start, attach, ready, submit); for network upload, listen to `page.on('requestfinished')` and `page.on('response')` for form submit URL to mark completion.
  - Outputs: `UploadedFiles` (string[]), `Success` (boolean).
  - Placement: `lib/workflow/executor/UploadExecutor.ts`, task `lib/workflow/task/UploadFiles.tsx`.
  - Registry: add `TaskType.UPLOAD_FILES`.

## Captcha Strategy [P2]
- Modular strategy with providers and fallbacks:
  - Structure:
    - Interface: `lib/workflow/executor/captcha/CaptchaStrategy.ts` defines `detect`, `solve`, `fallback`, `rateLimit`.
    - Providers: `reCAPTCHAProvider.ts`, `hCaptchaProvider.ts` supporting sitekey/token flows via external services (e.g., 2Captcha/AntiCaptcha) using credentials from `TaskParamType.CREDENTIAL` resolved in `setupEnvironmentForPhase` (`lib/workflow/executionWorkflow.ts:340-354`).
    - Executor: `lib/workflow/executor/CaptchaExecutor.ts` orchestrates detection and solving for current page; returns token injection result.
  - Detection:
    - In `evaluate`, search for common patterns: `grecaptcha`, `hcaptcha`, `<div class="g-recaptcha" data-sitekey>`, network requests to known endpoints.
  - Solving:
    - reCAPTCHA v2: obtain sitekey and page URL; request solve; inject token into `g-recaptcha-response` and execute challenge.
    - hCaptcha: similar flow using `h-captcha-response`.
    - v3: token-only with action; integrate if configured.
  - Fallback:
    - Manual solve: pause workflow, surface prompt/log, resume when user provides token via input; executor reads token from phase input.
  - Rate limiting:
    - Simple limiter: track attempts per domain and type; exponential backoff; refuse after threshold with `FAILED`.
  - Outputs: `CaptchaSolved` (boolean), `Provider` (string), `Token` (string).
  - Registry: add `TaskType.SOLVE_CAPTCHA` (P2 priority).

## Error Handling & Logging
- Use structured logs via `environment.log` as existing executors do (`FillInputExecutor.ts:7-21`, `ClickElementExecutor.ts:14-25`).
- Normalize error messages and reasons; include `selector`, `attempt`, and timing.
- Return `false` on failure; ensure environment outputs are serializable (engine filters browser instances at `lib/workflow/executionWorkflow.ts:276-305`).

## Performance & Debouncing
- Keep interaction latency under 100ms by:
  - Avoiding extra `sleep` beyond required politeness for network operations (typing/selection usually local DOM).
  - Debounce bursts: small timeout (default 50ms) between chunks of keystrokes; batched insert via `page.evaluate` when safe.
  - Measure elapsed times and log for tests.

## Testing Plan
- Unit tests (Vitest):
  - Mock `ExecutionEnvironment` (using `createExecutionEnvironment` guidance) and stub `page` methods.
  - Type Executor: validation, clear-before-type, debounce timing, error paths.
  - Select Executor: native and custom dropdown branches, search and keyboard navigation.
  - Upload Executor: type/size validation, multi-file handling, drag-and-drop dispatch.
- Integration tests (headless Puppeteer):
  - Spin a minimal HTML fixtures server (static pages) and run executors end-to-end.
  - Verify outputs and DOM states post-execution.
- Cross-browser testing:
  - Add Playwright-based e2e harness (separate `npm run e2e`) to run against Chromium/Firefox/WebKit for executor flows; keep primary runtime Puppeteer unchanged.
- Performance testing:
  - Measure interaction time with `performance.now()` around executor calls; assert <100ms for typical inputs on local DOM.

## Success Criteria Mapping
- Field coverage: Type Executor handles standard input types; Select covers native/custom; Upload supports multi and drag-and-drop; Captcha supports reCAPTCHA/hCaptcha.
- Sub-100ms interactions: enforced by tests and debouncing strategy; logs include timing to verify.
- 99% captcha success: multi-provider with retry/backoff plus manual fallback; track success rate via test harness across fixtures.
- Comprehensive logging and recovery: consistent structured logs and boolean returns; failures surface clear reasons.

## Files & Changes
- New TaskTypes: extend `types/TaskType.ts` to add `TYPE_INPUT`, `SELECT_OPTION`, `UPLOAD_FILES`, `SOLVE_CAPTCHA`.
- Executors:
  - `lib/workflow/executor/TypeExecutor.ts` (or enhance `FillInputExecutor.ts:4-22`).
  - `lib/workflow/executor/SelectExecutor.ts`.
  - `lib/workflow/executor/UploadExecutor.ts`.
  - `lib/workflow/executor/captcha/*` (strategy + providers) and `CaptchaExecutor.ts`.
- Tasks:
  - `lib/workflow/task/TypeInput.tsx`.
  - `lib/workflow/task/SelectOption.tsx`.
  - `lib/workflow/task/UploadFiles.tsx`.
  - `lib/workflow/task/SolveCaptcha.tsx` (P2).
- Registry updates: `lib/workflow/executor/registry.ts:36-58` add new mappings.
- Tests:
  - Unit: `tests/executors/type.executor.spec.ts`, `select.executor.spec.ts`, `upload.executor.spec.ts`, `captcha.executor.spec.ts`.
  - Integration: `tests/integration/form.executors.spec.ts` with fixtures.
  - Cross-browser: `tests/e2e/playwright/form.executors.spec.ts` (new harness).

## Rollout
- Phase 1: Type & Select executors and tests.
- Phase 2: Upload executor with drag-and-drop and tests.
- Phase 3 [P2]: Captcha strategy/providers and cross-browser tests.
- Phase 4: Performance tuning to hit <100ms and success metrics dashboard.

If this plan looks good, I’ll proceed to implement the new executors, tasks, registry updates, and tests exactly as outlined.