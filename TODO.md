Scraper Flow — TODO & Roadmap

High-Impact Improvements

- [x] Introduce unified logger across API and executors
  - Linked files: `lib/log.ts:1`, `types/log.ts:1`, `lib/workflow/executionPlan.ts:22`, `app/api/workflows/cron/route.ts:6`, `app/api/workflows/execute/route.ts:12`
- [x] Enrich `ExecutionLog` with phase id, task type, structured metadata [P0]
  - Linked files: `prisma/migrations/20250604170711_init/migration.sql:57`, `app/workflow/runs/[workflowId]/[executionId]/_components/ExecutionViewer.tsx:345`, `actions/workflows/getWorkflowPhaseDetails.ts:1`
  - DoD: logs include `phaseId`, `taskType`, `scope`; UI renders enriched fields; migration applied
- [x] Add runtime env validation using `zod` [P0]
  - Linked files: `app/api/workflows/execute/route.ts:14`, `app/api/webhooks/stripe/route.ts:1`, `lib/workflow/executionWorkflow.ts:375`
  - DoD: single `env` schema validates required vars; endpoints fail fast with 500 + reason
- [x] Remove hardcoded Chrome path; use env var or auto-detect [P0]
  - Linked files: `lib/workflow/executor/LaunchBrowserExecutor.ts:52`
  - DoD: supports `PUPPETEER_EXECUTABLE_PATH` with OS auto-detect fallback; documented in README
- [x] Add workflow-level retry/backoff policy captured in `ExecutionPhase` [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:1`, `types/workflow.ts`, `lib/workflow/executionPlan.ts:22`
  - DoD: per-task `maxAttempts` + backoff; persisted in phases; UI reflects attempts
- [x] Implement rate limiting and abuse protection for cron/execute endpoints [P0]
  - Linked files: `app/api/workflows/cron/route.ts:1`, `app/api/workflows/execute/route.ts:1`, `middleware.ts:1`
  - DoD: per-user and global limits; 429 responses with headers; public route scope tightened

- [x] Add idempotency keys and deduplication for triggers and outputs [P0]
  - Linked files: `app/api/workflows/cron/route.ts:132`, `app/api/workflows/execute/route.ts:1`, `lib/workflow/executionWorkflow.ts:1`
  - DoD: duplicate requests are safely ignored; outputs deduped via hash/fingerprint

- [x] Parallel phases and branching (AND/OR) in execution engine [P1]
  - Linked files: `lib/workflow/executionPlan.ts:22`, `lib/workflow/executionWorkflow.ts:1`
  - DoD: phases may run concurrently when inputs satisfied; branching supported; UI visualizes concurrency

- [x] Worker pool for executors with configurable concurrency [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:1`, `lib/workflow/executor/registry.ts:25`
  - DoD: limit concurrent pages/browsers; backpressure; metrics per worker

- [x] Page/browser reuse and resource blocking for performance [P1]
  - Linked files: `lib/workflow/executor/LaunchBrowserExecutor.ts:1`
  - DoD: reuse single browser context when possible; block images/fonts/ads optionally; measure wins

Testing & Quality

- [x] Establish `vitest` runner and coverage reporting [P1]
  - Linked files: `package.json:5`, `.eslintrc.json:1`
  - DoD: `npm run test` passes locally + CI; coverage threshold ≥80% for core libs
- [ ] Unit tests for workflow orchestration and credit consumption [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:1`, `lib/workflow/executionPlan.ts:22`, `lib/workflow/creditCheck.ts:1`
- [ ] Integration tests for cron scheduling path [P1]
  - Linked files: `app/api/workflows/cron/route.ts:1`
- [ ] Executor tests: navigation, click, extraction, file download [P1]
  - Linked files: `lib/workflow/executor/registry.ts:25`, `lib/workflow/executor/LaunchBrowserExecutor.ts:1`
- [ ] Credential encryption/decryption tests and secret handling [P1]
  - Linked files: `README.md:92` (Encryption), `prisma/migrations/20250604170711_init/migration.sql:86`
- [ ] Stripe webhook tests (happy path + signature failures) [P1]
  - Linked files: `app/api/webhooks/stripe/route.ts:1`, `lib/stripe/stripe.ts`

- [ ] Playwright e2e tests for editor and execution viewer [P1]
  - Linked files: `app/workflow/_components/Editor.tsx:1`, `app/workflow/runs/[workflowId]/[executionId]/_components/ExecutionViewer.tsx:345`
  - DoD: basic flows covered: create workflow, validate, run, inspect logs

- [ ] Property-based tests for plan builder (graph constraints) [P2]
  - Linked files: `lib/workflow/executionPlan.ts:22`

Security & Compliance

- [x] Verify Stripe API version pinned in client initialization [P0]
  - Linked files: `lib/stripe/stripe.ts`, `package.json:77`
- [x] Narrow public route scope; confirm required endpoints [P0]
  - Linked files: `middleware.ts:1`
- [x] Mask/redact sensitive data in logs; audit credential access [P0]
  - Linked files: `lib/log.ts:1`, `docs/logging-policies.md:1`
- [x] Add per-user and per-endpoint rate limiting; consider IP throttling [P0]
  - Linked files: `app/api/workflows/execute/route.ts:1`, `app/api/workflows/cron/route.ts:1`
- [ ] Secret management checklist for local and Vercel [P1]
  - Linked files: `docs/deployment-monitoring.md:1`, `README.md:144`

- [ ] GDPR/CCPA data retention and deletion policies [P1]
  - Linked files: `prisma/schema.prisma:1`, `README.md:257`

- [ ] RBAC and organization-level access controls [P2]
  - Linked files: `middleware.ts:1`, `actions/**`

- [ ] OAuth-based credential types for external services [P2]
  - Linked files: `prisma/schema.prisma:86`, `actions/credentials/**`

Performance & DX

- [x] Audit client components for memoization and re-renders [P2]
  - Linked files: `components/Sidebar.tsx:1`, `components/ui/**`
- [ ] Code-splitting for workflow editor modules and inspector panels [P2]
  - Linked files: `app/workflow/**`
- [ ] Optimize Prisma client lifecycle for dev/prod [P1]
  - Linked files: `lib/prisma.ts`, `actions/**`
- [ ] Add profiling hooks to measure executor runtime per phase [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:375`, `types/executor.ts:1`
- [ ] Headful Puppeteer dev mode with visual step runner (env-guarded) [P2]
  - Linked files: `lib/workflow/executor/LaunchBrowserExecutor.ts:1`
- [ ] Improve error surfaces in UI; toast + contextual messages [P2]
  - Linked files: `app/workflow/runs/[workflowId]/[executionId]/_components/ExecutionViewer.tsx:345`

- [ ] Response caching and artifact caching to reduce re-scrapes [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:1`, `lib/workflow/task/**`

- [ ] CLI for workflow operations (run, export, inspect) [P2]
  - Linked files: `actions/workflows/**`, `lib/workflow/**`

- [ ] Public API for workflows, executions, and artifacts [P2]
  - Linked files: `app/api/**`

- [ ] SDK (TypeScript) for integrations and custom tasks [P3]
  - Linked files: `types/**`, `lib/workflow/task/registry.ts:25`

Scheduling & Resilience

- [ ] Backoff/retry per task with max attempts tracked in DB [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:1`, `prisma/schema.prisma`
- [ ] Deadline/cancellation support and graceful teardown [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:406`
- [ ] Cron schedule validation and preview utility in dashboard [P1]
  - Linked files: `lib/cron/scheduleParser.ts`, `app/workflow/**`
- [ ] Idempotency keys for execution triggers to avoid duplicates [P0]
  - Linked files: `app/api/workflows/cron/route.ts:132`, `app/api/workflows/execute/route.ts:1`
- [ ] Dead-letter queue or recovery pass for FAILED executions [P2]
  - Linked files: `actions/workflows/getWorkflowExecutions.ts:1`

- [ ] Pause/resume and schedule windows with timezone support [P1]
  - Linked files: `app/api/workflows/cron/route.ts:1`, `lib/cron/scheduleParser.ts`

- [ ] Blackout windows and drift handling for cron jobs [P2]
  - Linked files: `app/api/workflows/cron/route.ts:1`

Data & Export

- [ ] CSV/JSON export endpoints and UI for artifact downloads [P2]
  - Linked files: `lib/workflow/task/DeliverViaWebhook.tsx:1`, `app/api/**`
- [ ] Attach execution artifacts (files, HTML snapshots) to `WorkflowExecution` [P2]
  - Linked files: `lib/workflow/executionWorkflow.ts:1`, `prisma/schema.prisma`
- [ ] Add results viewer with filtering, pagination, search [P2]
  - Linked files: `app/workflow/runs/[workflowId]/[executionId]/_components/ExecutionViewer.tsx:345`
- [ ] Optional webhooks and integrations (Zapier, Slack, Sheets) [P3]

- [ ] S3/Cloud storage for artifacts with signed URL downloads [P2]
  - Linked files: `lib/workflow/executionWorkflow.ts:1`, `app/api/**`

- [ ] Notion/Google Drive exporters for structured results [P2]
  - Linked files: `lib/workflow/task/**`

- [ ] Streaming results and incremental updates for long runs [P2]
  - Linked files: `lib/workflow/executionWorkflow.ts:1`

Workflow Features

- [ ] Templates for common flows: list→detail, pagination, login + extract [P2]
- [x] Politeness features: robots.txt awareness, randomized delays, UA rotation [P0]
  - Linked files: `lib/workflow/executor/LaunchBrowserExecutor.ts:10`, `lib/politeness/**`, `types/politeness.ts`
- [x] Form interaction executors: type, select, upload; captcha strategy [P2]
- [x] Dynamic page handling: infinite scroll, intercept network responses [P2]
- [x] AI-assisted selector generation and validation feedback loop [P2]

- [x] Stealth mode and anti-bot evasion options [P2]
  - Linked files: `lib/workflow/executor/LaunchBrowserExecutor.ts:1`

- [x] Proxy rotation and session/cookie jar management [P2]
  - Linked files: `lib/workflow/executionWorkflow.ts:1`

- [x] Advanced extraction: XPath/CSS, network intercept, GraphQL [P2]
  - Linked files: `lib/workflow/executor/**`

- [x] Form automation improvements: file upload, 2FA, captcha providers [P2]
  - Linked files: `lib/workflow/executor/**`, `actions/credentials/**`

UI/UX Enhancements

- [ ] Onboarding checklist and sample workflow import [P2]
- [ ] Node library browser with search and usage examples [P2]
- [ ] Execution timeline view with phase-level logs and statuses [P1]
  - Linked files: `app/workflow/runs/[workflowId]/[executionId]/_components/ExecutionViewer.tsx:345`
- [ ] Credential manager improvements: test connection, last-used metadata [P2]
- [ ] Billing page clarity: credit usage charts and alerts [P2]

- [ ] Accessibility (WCAG) review and keyboard navigation in editor [P2]
  - Linked files: `app/workflow/_components/Editor.tsx:1`, `components/ui/**`

- [ ] Localization (i18n) for dashboard and editor [P2]
  - Linked files: `app/**`, `components/**`

- [ ] Template gallery with preview and quick-start wizards [P2]
  - Linked files: `app/workflow/**`

DevOps & CI/CD

- [ ] Add CI pipeline: lint, typecheck, tests, build [P0]
  - Linked files: `package.json:5`, `.eslintrc.json:1`
  - DoD: CI runs `npm run lint`, `npm run test`, `npm run build` on PRs
- [ ] Pre-commit hooks with `lint-staged` and `husky` [P1]
- [ ] Release checklist and environment promotion strategy [P2]
- [ ] Optional Dockerfile and compose for local Postgres [P2]

- [ ] Load testing suite for API routes and executors [P2]
  - Linked files: `app/api/**`, `lib/workflow/executor/**`

- [ ] OpenTelemetry tracing for API and execution engine [P1]
  - Linked files: `app/api/**`, `lib/workflow/executionWorkflow.ts:1`

Documentation

- [ ] Expand README with troubleshooting (Windows/macOS/Linux) [P1]
  - Linked files: `README.md:144`
- [ ] Document env vars with required vs optional and defaults [P0]
- [ ] Executor authoring guide and best practices [P2]
- [ ] Security hardening guide and incident response playbook [P2]

- [ ] Plugin authoring guide and executor interfaces [P2]
  - Linked files: `lib/workflow/executor/registry.ts:25`, `types/TaskType.ts`

- [ ] Workflow JSON schema and versioning strategy [P1]
  - Linked files: `types/workflow.ts`, `lib/workflow/executionPlan.ts:22`

Observability

- [ ] Structured logs with correlation ids per execution [P1]
  - Linked files: `lib/log.ts:1`, `types/log.ts:1`
- [ ] Metrics: success rate, average phase duration, credit consumption [P1]
- [ ] Error taxonomies and dashboards for top failures [P2]
- [ ] Alerting for cron driver failures and webhook signature mismatches [P1]
  - Linked files: `app/api/workflows/cron/route.ts:1`, `app/api/webhooks/stripe/route.ts:1`

- [ ] Dashboards: top failures, retries, phase durations, credit burn [P1]
  - Linked files: `lib/log.ts:1`, `actions/workflows/getWorkflowExecutions.ts:1`

- [ ] Log correlation: workflowId, executionId, phaseId across layers [P1]
  - Linked files: `lib/log.ts:1`, `lib/workflow/executionWorkflow.ts:1`

Backlog & Ideas

- [ ] Marketplace for community executor/plugins [P3]
- [ ] Team features: role-based access, shared credentials with scopes [P3]
- [ ] Multi-region execution strategies and failover [P3]
- [ ] Privacy-preserving scraping modes and legal compliance helpers [P3]
- [ ] Cost reporting per workflow and forecasted credit needs [P3]

- [ ] Multi-tenant billing with plans, coupons, proration [P3]
- [ ] Offline-first runs with resume and checkpointing [P3]
- [ ] Map/Reduce-style tasks for large lists [P3]
- [ ] Visual diffs for HTML snapshots between runs [P3]

Notes

- Link tasks to specific files/modules during implementation
- Prefer small, incremental PRs with tests and docs updates
