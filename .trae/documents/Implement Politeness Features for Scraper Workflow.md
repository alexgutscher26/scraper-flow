## Overview
- Add configurable, test-covered politeness features integrated into Puppeteer-based workflow execution without degrading performance.
- Features: robots.txt awareness, randomized delays with jitter, user-agent rotation with header randomization. All toggleable via config, with comprehensive logging and error handling.

## Architecture Changes
- Politeness utilities (new):
  - `lib/politeness/robots.ts`: fetch/parse robots.txt; `isAllowed(url, userAgent)` with caching and enforcement mode.
  - `lib/politeness/delay.ts`: delay generator `computeDelay(config)` supporting min/max, jitter, distribution strategy.
  - `lib/politeness/userAgent.ts`: UA pool, rotation strategy, `applyHeaders(page, config)` to set `user-agent` and extra headers.
  - `types/politeness.ts`: `PolitenessConfig` and `PolitenessEnforcementMode` types; defaults.
- Environment extensions:
  - Extend `Environment` and `ExecutionEnvironment` (in `types/executor.ts`) with `politenessConfig` and (optional) `politenessState` for caching (e.g., per-domain robots results, lastDelayAt).
- Config sourcing:
  - Default from env (e.g., `POLITENESS_ROBOTS_ENABLED`, `POLITENESS_DELAY_MIN_MS`, `POLITENESS_DELAY_MAX_MS`, `POLITENESS_UA_ROTATION_ENABLED`).
  - Per-workflow override via `workflow.definition.settings.politeness` (no schema change needed).
- Logging:
  - Use `createLogger` and `LogCollector` to record compliance decisions, chosen delays, UA/header selections. Persist via phase logs.

## Integration Points
- Launch browser: `lib/workflow/executor/LaunchBrowserExecutor.ts`
  - After `newPage()` and before initial `goto` (file_path:line_number: lib/workflow/executor/LaunchBrowserExecutor.ts:60–65), call `applyHeaders(page, config)`.
  - Check `robots.isAllowed(websiteUrl, currentUA)`; if disallowed, log and return false.
- Navigate URL: `lib/workflow/executor/NavigateUrlExecutor.ts`
  - Before `page.goto(url)` (lib/workflow/executor/NavigateUrlExecutor.ts:14), perform:
    - Delay: `await sleep(computeDelay(config))` when delay feature enabled.
    - UA/header rotation: `applyHeaders(page, config)` when enabled.
    - Robots check: `isAllowed(url, currentUA)`; if disallowed, log decision and short-circuit.
- Click element: `lib/workflow/executor/ClickElementExecutor.ts`
  - Pre-action polite delay when enabled to keep natural rhythm; minimal overhead.
- Execution workflow pre-phase hook: `lib/workflow/executionWorkflow.ts`
  - Initialize `politenessConfig` and `politenessState` once per execution (near environment init: lib/workflow/executionWorkflow.ts:34–41).
  - Optional generic pre-phase delay for network-affecting tasks (LAUNCH_BROWSER, NAVIGATE_URL, CLICK_ELEMENT). This centralizes behavior and reduces duplication.

## PolitenessConfig Details
- `robots`:
  - `enabled: boolean`, `enforcement: 'strict'|'lenient'`, `userAgentOverride?: string`.
  - Behavior: strict = block disallowed; lenient = log warning, allow if fetch fails.
- `delays`:
  - `enabled: boolean`, `minMs: number`, `maxMs: number`, `jitterPct: number` (± percentage), `strategy: 'uniform'|'normal'`.
  - Compute delay within bounds; add jitter; ensure minimum spacing across phases.
- `userAgent`:
  - `enabled: boolean`, `pool: string[]` (default realistic UA list), `rotateStrategy: 'perNavigation'|'perDomain'|'perSession'`.
  - `headers`: configurable map; include randomized `accept-language` from a common set when enabled.

## Error Handling
- Robots fetch failure: log with scope `politeness/robots`; apply `enforcement` fallback.
- Delay computation errors: default to small safe delay; never throw.
- UA/header application errors: log and continue; never crash executor.

## Logging & Audit Trail
- Scope-based logs via `createLogger`:
  - `politeness/robots`: domain, path, UA, decision, enforcement mode.
  - `politeness/delay`: chosen delay, inputs (min/max/jitter/strategy).
  - `politeness/ua`: selected UA, headers applied.
- Phase logs persisted by existing mechanism (`executionWorkflow.ts` finalizePhase), ensuring traceability.

## Unit Tests (Vitest)
- Add devDep `vitest` and script `test`.
- Tests under `tests/politeness/`:
  - `robots.spec.ts`: parse groups, match disallow/allow, UA-specific rules, caching behavior.
  - `delay.spec.ts`: distributions, bounds, jitter correctness.
  - `userAgent.spec.ts`: rotation strategies, custom pool override, header randomization.
- CI-friendly: pure functions; no network (mock robots fetch).

## Documentation
- New doc `docs/politeness.md`:
  - Usage: env vars, workflow JSON override example.
  - Best practices: respectful crawl rates, honoring robots, realistic UA, language headers.
  - Troubleshooting: blocked requests, tuning delays, strict vs lenient.

## Success Criteria & Verification
- Blocked requests reduction: capture and compare `error` logs vs prior runs; add counters in logs.
- Compliance: robots decisions logged for each navigation.
- Performance: delays only applied to network-affecting tasks; configurable to disable entirely.
- Audit trail: phase logs include all politeness decisions.

## Implementation Steps
1) Create `types/politeness.ts` with config types and defaults.
2) Implement `lib/politeness/robots.ts` (fetch, parse, cache, check) with strict/lenient.
3) Implement `lib/politeness/delay.ts` (uniform/normal, jitter, min spacing).
4) Implement `lib/politeness/userAgent.ts` (pool, selection, headers, accept-language).
5) Extend `types/executor.ts` to carry `politenessConfig` and `politenessState` in `Environment`.
6) Wire config in `lib/workflow/executionWorkflow.ts` at environment init; provide pre-phase delay hook for selected tasks.
7) Update `LaunchBrowserExecutor` and `NavigateUrlExecutor` to enforce robots, apply UA/headers, and delays with logging; add minor delay before `ClickElementExecutor`.
8) Add unit tests and `test` script; ensure tests pass locally.
9) Add `docs/politeness.md` documenting usage and best practices.

## File References Affected
- `lib/workflow/executor/NavigateUrlExecutor.ts:14` (insert pre-goto checks).
- `lib/workflow/executor/LaunchBrowserExecutor.ts:60–65` (apply headers; robots check on initial URL).
- `lib/workflow/executor/ClickElementExecutor.ts:13` (optional pre-click delay).
- `lib/workflow/executionWorkflow.ts:34–41, 317–383` (environment init, execution environment creation, finalize logs).
- `types/executor.ts:6–28` (extend Environment/ExecutionEnvironment).

## Assumptions
- Workflow-level config will be provided via `definition.settings.politeness` when needed; otherwise env defaults.
- No UI changes required for toggles initially; backend-only configuration satisfies requirements.

## Rollout
- Implement behind default-safe config (robots: enabled strict; delays: enabled with modest defaults; UA rotation: enabled per-navigation).
- Provide a migration note if env vars are used.
- Validate on a sample workflow with `LaunchBrowser` → `Navigate URL` → `Page to HTML`.
