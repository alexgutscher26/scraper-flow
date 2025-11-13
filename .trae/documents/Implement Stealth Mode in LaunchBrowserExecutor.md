## Scope

- Enhance `lib/workflow/executor/LaunchBrowserExecutor.ts` only, adding configurable stealth and anti-bot evasion while integrating with existing politeness, headers, and logging patterns.
- No new external packages; rely on Puppeteer primitives and existing utilities (`applyHeaders`, politeness delays, logging).

## Key Additions in LaunchBrowserExecutor

- New internal option types:
  - `StealthOptions`: `enabled`, `fingerprintSpoofing`, `mouseMovement`, `randomizedDelays`, `userAgentRotation`, `cookieManagement`.
  - `EvasionParams`: `mouse: { pathPoints, jitterPx, minSpeed, maxSpeed }`, `delays: { minMs, maxMs, jitterPct }`, `fingerprint: { languagesPool, platformPool, deviceMemoryRange, hardwareConcurrencyRange, webglSpoofing }`, `uaOverride`, `uaRotateStrategy`.
  - `CookieSettings`: `clearBefore`, `set`, `persist`.
- Read optional inputs from the task environment (kept backward compatible):
  - `stealth?: StealthOptions`, `evasionParams?: EvasionParams`, `cookies?: CookieSettings`, `userAgentOverride?: string`.
  - Fallback to existing politeness config/state when options are undefined.
- Hook points:
  - Before browser launch: compute fingerprint values; attach `evaluateOnNewDocument` scripts to spoof `navigator` and common signals.
  - Immediately after page creation: apply user-agent/headers via existing `applyHeaders(page, config, state, url)`; allow per-task `uaOverride` or `uaRotateStrategy` to override politeness defaults.
  - Around navigation: insert randomized human-like delays and optional mouse movement pre/post navigation.
  - Cookie management: optionally clear cookies, set provided cookies, and persist if requested.
  - Detection probe: after navigation, run page checks for common bot-detection signals and record metrics.

## Evasion Techniques (Contained Implementation)

- Randomized Delays:
  - Use existing delay utilities when available; otherwise compute uniform/normal delays with jitter locally.
  - Insert small delays at: before navigation, after `domcontentloaded`, before first interaction.
- Mouse Movement Patterns:
  - Generate a path across random viewport waypoints; call `page.mouse.move(x, y, { steps })` with jitter and speed range.
  - Optionally include small `page.mouse.down/up` on benign areas; configurable via `evasionParams.mouse`.
- Fingerprint Spoofing:
  - `page.evaluateOnNewDocument` to set:
    - `Object.defineProperty(navigator, 'webdriver', { get: () => false })`.
    - Fake `navigator.plugins.length > 0` and `navigator.languages` from pool.
    - Override `navigator.platform`, `navigator.hardwareConcurrency`, `navigator.deviceMemory` with ranges.
    - Define a minimal `window.chrome` object and patch `permissions.query` for `notifications` to return a resolved state.
    - Basic WebGL spoofing for `UNMASKED_VENDOR`/`UNMASKED_RENDERER` via `getParameter` hook when enabled.
- User-Agent Rotation:
  - Prefer existing politeness rotation (`applyHeaders`), but allow an explicit per-task `uaOverride` and `uaRotateStrategy` to supersede.
  - Keep `accept-language` randomization aligned with existing utility.
- Cookie Management:
  - If `cookies.clearBefore`, run `page.deleteCookie(...allCookies)` or use `page._client().send('Network.clearBrowserCookies')` if available.
  - If `cookies.set`, call `page.setCookie(...cookies)` before navigation.
  - If `cookies.persist`, retain context and skip `browserContext.clearPermissionOverrides`.

## Error Handling & Logging

- Wrap each evasion technique with try/catch; on error:
  - Log with `environment.log` scoped to `LaunchBrowserExecutor` and continue with degraded mode.
  - Record a fallback flag and avoid retrying the same technique within the session.
- On navigation failures likely due to bot walls:
  - Retry once with a different UA (if rotation enabled) and shorter delays.
  - If still blocked and robots enforcement is strict, exit gracefully with `false`.
- Structured logs:
  - Emit entries for: `STEALTH_INIT`, `FINGERPRINT_APPLIED`, `MOUSE_SIMULATION`, `DELAY_APPLIED`, `COOKIE_SET`, `DETECTION_PROBE`, `EVASION_RETRY`, `EVASION_FALLBACK`.

## Metrics Collection (Contained)

- Maintain counters in executor scope:
  - `evasionAttempts`, `evasionFailures`, `detectionsFound`.
- After navigation, run probe:
  - Search DOM for keywords: `captcha`, `verify you are human`, `unusual traffic`, `blocked by bot`, `Access Denied`, common vendor marks (e.g., `DataDome`, `PerimeterX`, `Cloudflare`).
  - Update metrics and log a summary record.
- Output metrics via `environment.setOutput('evasionMetrics', {...})` for later phases/UI.

## Configuration Options (Backward Compatible Defaults)

- New optional inputs on the `LaunchBrowser` task (read but do not require changes elsewhere):
  - `stealth.enabled`: default `false`.
  - `stealth.randomizedDelays`: default `true` when `stealth.enabled`.
  - `stealth.mouseMovement`: default `false`.
  - `stealth.fingerprintSpoofing`: default `true` when `stealth.enabled`.
  - `stealth.userAgentRotation`: default `true`, uses politeness state.
  - `stealth.cookieManagement`: default `{ clearBefore: false, persist: true }`.
  - `evasionParams` defaults sensible values; `uaOverride` undefined.
- If none provided, behavior remains identical to current executor.

## Testing Plan

- Local dev with `puppeteer`:
  - Navigate to known bot-guarded endpoints (e.g., search engines, retail sites) and confirm fewer challenges.
  - Validate metrics outputs and logs reflect probes.
- Performance checks:
  - Measure added delay overhead (target < 250ms pre-nav, < 250ms post-nav average when enabled).
  - Ensure no significant impact on page load times beyond configured delays.
- Cross-browser (Chromium versions):
  - Dev Chrome stable and beta; Production `@sparticuz/chromium-min` path.
  - Validate `evaluateOnNewDocument` runs and does not crash in headless/new headless modes.

## Documentation

- JSDoc for new internal helpers and option types within the file.
- README updates:
  - New subsection: “Stealth Mode & Anti-bot Evasion” with examples showing `stealth` and `evasionParams` inputs for the Launch Browser task.
  - Note on user-agent rotation and accept-language via politeness config.
  - Caveats and suggested parameters for stricter sites.
- Workflow docs:
  - Add options reference for the Launch Browser step and how it interacts with politeness settings.

## Rollout & Compatibility

- Keep all changes internal to `LaunchBrowserExecutor.ts` with default-off flags.
- Preserve existing environment interactions and output filters.
- No changes to executor registry or external types required.

## Implementation Outline (Inside the File)

1. Define `StealthOptions`, `EvasionParams`, `CookieSettings` types.
2. Read inputs: `const stealth = input.stealth ?? defaults; const evasion = input.evasionParams ?? defaults;`.
3. Before launch: prepare fingerprint spoofing script if enabled.
4. Launch browser per existing branch (prod/dev) unchanged.
5. Create page; attach spoofing script; apply headers/user-agent.
6. Apply cookies per settings.
7. If enabled, run pre-nav delay and optional mouse movement.
8. Navigate; run post-nav delay and detection probe.
9. Log metrics and set outputs; return `true`/`false` consistently.

Confirm this plan and I’ll implement the changes, add JSDoc, and provide usage examples.
