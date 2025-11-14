## Overview

- Implement infinite scrolling with loading UI, scroll restoration, and configurable thresholds.
- Add a centralized fetch middleware for interception, TTL caching, retries, metrics, and debouncing.
- Optimize performance with virtualization, lazy media loading, and minimized DOM reflows.
- Use existing Next.js App Router, server actions, and `@tanstack/react-query`.

## Stack Alignment

- Frontend: Next.js App Router with React.
- Data: Server actions + `@tanstack/react-query` via `components/providers/AppProviders.tsx:12`.
- Current fetch usage: Direct `fetch` calls across client/server and executors.

## New Modules

- `lib/http.ts`: `httpFetch` wrapper providing:
  - Response interception (normalize errors, collect metrics, attach auth headers when applicable).
  - TTL cache (in-memory Map with `ttl`, `maxSize`, `sweepInterval`, cache key = URL + method + body + headers hash; cache JSON bodies not raw `Response`).
  - Automatic retries (exponential backoff with jitter; configurable `retries`, `retryOn` status codes).
  - Debouncing/deduping inflight identical requests via an inflight map.
  - Memory management: LRU eviction and periodic sweep.
  - Abort support via `AbortController` to prevent leaks.
- `lib/metrics/http.ts`: Collect `duration`, `status`, `size`, `endpoint` and emit via a simple event bus or logger for aggregation.
- `lib/ui/hooks/useInfiniteScroll.ts`: IntersectionObserver-based hook with configurable threshold (default 0.8), debounced trigger, and loading flags.
- `lib/ui/hooks/useScrollRestoration.ts`: Store/restore per-route scroll via `sessionStorage`, use `history.scrollRestoration = 'manual'`.

## Infinite Scroll

- Target view: executions table `app/workflow/runs/[workflowId]/_components/ExecutionasTable.tsx:23–118`.
- Replace `useQuery` with `useInfiniteQuery`:
  - `queryKey`: `["executions", workflowId]`.
  - `queryFn`: server action with pagination.
  - `getNextPageParam`: cursor or skip/take.
- Pagination support in server action:
  - Extend `actions/workflows/getWorkflowExecutions.ts:6–19` to accept optional `{ cursor?: string; take?: number }` or `{ skip?: number; take?: number }`.
  - Default behavior unchanged (full list) to preserve existing callers.
- Triggering:
  - Use `useInfiniteScroll` with `threshold=0.8` against the scroll container (`div.border.rounded-lg.shadow-md.overflow-auto` at `ExecutionasTable.tsx:39`).
  - When `80%` reached, call `fetchNextPage()`. Debounce to avoid multiple quick calls.
- UI/UX:
  - Loading indicator below the table (spinners/skeleton rows) during `isFetchingNextPage`.
  - Disable trigger while `isFetching` or `hasNextPage` is false; show "All results loaded".
- Virtualization:
  - Introduce `@tanstack/react-virtual` to render only visible rows in `TableBody`.
  - Row component extracted and memoized to minimize re-renders.
- Scroll restoration:
  - Apply `useScrollRestoration` keyed by `usePathname()`; restore on mount, save on unmount or visibility change.

## Network Interception

- Centralize all first-party `fetch` calls via `lib/http.ts` to reach near-100% coverage:
  - `components/LocalCronRunner.tsx:35` → `http.get('/api/workflows/cron', { cache: 'no-store' })`.
  - `lib/workflow/executor/GraphQLQueryExecutor.ts:52–59` → `http.post(endpoint, { body: { query, variables } })`.
  - `lib/workflow/executor/DownloadFileExecutor.ts:166–177` → `http.get(downloadUrl, { headers, signal })`.
  - `lib/workflow/executor/DeliverViaWebhookExecutor.ts:16–22` → `http.post(targetUrl, { body })`.
  - `lib/politeness/robots.ts:3–7` → `http.get(robotsUrl, { headers })`.
- Browser `page.evaluate` fetches:
  - Not our runtime; for best-effort metrics, inject a small init script before `page.evaluate` to wrap `window.fetch` with timing logs when permissible. Keep correctness priority; do not alter third-party page behavior.
- App-wide defaults:
  - Configure `QueryClient` defaults in `components/providers/AppProviders.tsx:10–19` (`retry`, `staleTime`, `cacheTime`, `refetchOnWindowFocus=false`).

## Performance

- Debounce network triggers:
  - Inside `useInfiniteScroll`, coalesce triggers to a single call per `N` ms (e.g., 250ms).
  - In `httpFetch`, dedupe identical inflight requests.
- Lazy load media:
  - Ensure any images use `loading="lazy"` (Next Image is lazy by default); audit components like `components/screenshot/ScreenshotDownload.tsx:54–59` keep as-is.
- Virtualization:
  - Use `@tanstack/react-virtual` for large lists. Target `ExecutionasTable.tsx` first; extend to other lists if needed.
- Optimize DOM updates:
  - Memoize row components; use `useCallback`/`useMemo` for computed values.
  - Batch new page appends with `startTransition` to keep UI responsive.

## Error Handling & Retries

- Standardize error objects (`{ message, status, code }`).
- Automatic retries for transient errors (429/502/503/504) with exponential backoff and max cap.
- Surface human-readable messages and toasts where appropriate.

## Mobile & Touch Support

- Use passive scroll listeners (`{ passive: true }`) and IntersectionObserver for touch-friendly behavior.
- Ensure hit targets and loading indicators are accessible and responsive.

## Unit Tests (Vitest)

- `lib/ui/hooks/useInfiniteScroll.test.ts`:
  - Threshold crossing at 80% invokes callback once; debouncing verified.
  - Loading flags and disable behavior when `hasNextPage=false`.
- `lib/ui/hooks/useScrollRestoration.test.ts`:
  - Saves per-route position; restores on mount; respects `history.scrollRestoration`.
- `lib/http.test.ts`:
  - TTL caching returns cached JSON within ttl, misses after expiry.
  - Retry logic for transient errors; backoff schedule.
  - Inflight dedupe returns same promise for identical requests.
  - Metrics emitted with `duration`, `status`, `size`.
  - Abort cancels request; no leaks.
- `ExecutionasTable.test.tsx` (jsdom):
  - `useInfiniteQuery` pagination integrates with observer; renders more rows on trigger.
  - Virtualization renders only visible subset; scroll causes rendering changes.

## Rollout & Migration

- Phase 1: Introduce `lib/http.ts` and integrate in `LocalCronRunner.tsx:35`, `robots.ts:3–7`.
- Phase 2: Update executors (`GraphQLQueryExecutor.ts:52–59`, `DownloadFileExecutor.ts:166–177`, `DeliverViaWebhookExecutor.ts:16–22`).
- Phase 3: Add `useInfiniteScroll` and refactor `ExecutionasTable.tsx` to `useInfiniteQuery` with paginated server action.
- Phase 4: Virtualization and scroll restoration; finalize loading UI.
- Phase 5: Add tests; tune `QueryClient` defaults.

## Success Verification

- Infinite scroll feels seamless with spinners and no jank; virtualization ensures smoothness.
- Interception coverage: All first-party fetches route through `lib/http.ts` (list above).
- Metrics show sub-100ms median time-to-fetch-start for scroll-triggered loads; when cached, sub-100ms end-to-end.
- No memory leaks: No accumulating listeners; aborted in-flight on unmount; LRU+TTL sweeps.

## Notes on API Compatibility

- `GetWorkflowExecutions` extension is backward-compatible (optional params). Existing calls remain functional.
- No changes to public API routes required; all client logic remains within app components/hooks.

## File References (entry points)

- `app/workflow/runs/[workflowId]/_components/ExecutionasTable.tsx:31–36` — current polling-based query.
- `components/providers/AppProviders.tsx:10–19` — `QueryClientProvider` setup.
- `components/LocalCronRunner.tsx:35–43` — direct `fetch` polling.
- `lib/workflow/executor/GraphQLQueryExecutor.ts:52–59` — server-side fetch.
- `lib/workflow/executor/DownloadFileExecutor.ts:166–177` — direct fetch with timeout.
- `lib/workflow/executor/DeliverViaWebhookExecutor.ts:16–22` — webhook POST.
- `lib/politeness/robots.ts:3–7` — robots fetch.

## Dependencies

- Add `@tanstack/react-virtual` for virtualization.
- Keep existing `@tanstack/react-query`; no axios introduced.
