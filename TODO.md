Scraper Flow — TODO & Roadmap

High-Impact Improvements

- [x] Introduce unified logger and replace `console.log` across API and executors
- [ ] Enrich `ExecutionLog` with phase id, task type, and structured metadata
- [ ] Add runtime env validation (e.g., `zod`) to fail fast on missing secrets
- [ ] Remove hardcoded Chrome path; use env var or auto-detect for cross-platform dev
- [ ] Add workflow-level retry/backoff policy captured in `ExecutionPhase`
- [ ] Implement rate limiting and abuse protection for public cron/execute endpoints

Testing & Quality

- [ ] Set up test runner (e.g., `vitest`) and coverage reporting
- [ ] Unit tests for workflow engine orchestration and credit consumption
- [ ] Integration tests for `app/api/workflows/cron/route.ts` scheduling path
- [ ] Executor tests: navigation, click, extraction (including AI), file download
- [ ] Credential encryption/decryption tests and secret handling
- [ ] Stripe webhook tests (happy path + signature verification failures)

Security & Compliance

- [ ] Verify Stripe API version is valid and pinned in client initialization
- [ ] Narrow public route scope in `middleware.ts` and confirm required endpoints
- [ ] Add request validation and input sanitization to API routes
- [x] Mask/redact sensitive data in logs; audit credential access
- [ ] Add per-user and per-endpoint rate limiting; consider IP-based throttling
- [ ] Secret management checklist for local and Vercel environments

Performance & DX

- [ ] Audit client components for memoization and unnecessary re-renders
- [ ] Code-splitting for heavy workflow editor modules and inspector panels
- [ ] Optimize Prisma client lifecycle for dev/production; review connection handling
- [ ] Add profiling hooks to measure executor runtime per phase
- [ ] Headful Puppeteer dev mode with visual step runner (env-guarded)
- [ ] Improve error surfaces in UI; toast + inline contextual messages

Scheduling & Resilience

- [ ] Backoff/retry per task with max attempts tracked in DB
- [ ] Deadline/cancellation support and graceful teardown of browser contexts
- [ ] Cron schedule validation and preview utility in dashboard
- [ ] Idempotency keys for execution triggers to avoid duplicates
- [ ] Dead-letter queue or recovery pass for FAILED executions

Data & Export

- [ ] CSV/JSON export endpoints and UI for artifact downloads
- [ ] Attach execution artifacts (files, HTML snapshots) to `WorkflowExecution`
- [ ] Add results viewer with filtering, pagination, and search
- [ ] Optional webhooks and integrations (Zapier, Slack, Google Sheets)

Workflow Features

- [ ] Templates for common scraping flows: list→detail, pagination, login + extract
- [x] Politeness features: robots.txt awareness, randomized delays, user-agent rotation
- [ ] Form interaction executors: type, select, upload; captcha handling strategy
- [ ] Dynamic page handling: infinite scroll, intercept network responses
- [ ] AI-assisted selector generation and validation feedback loop

UI/UX Enhancements

- [ ] Onboarding checklist and sample workflow import
- [ ] Node library browser with search, categories, and usage examples
- [ ] Execution timeline view with phase-level logs and statuses
- [ ] Credential manager improvements: test connection, last-used metadata
- [ ] Billing page clarity: credit usage charts and alerts

DevOps & CI/CD

- [ ] Add CI pipeline: lint, typecheck, tests, build
- [ ] Pre-commit hooks with `lint-staged` and `husky`
- [ ] Release checklist and environment promotion strategy (dev→staging→prod)
- [ ] Optional Dockerfile and compose for local Postgres

Documentation

- [ ] Expand README with troubleshooting (Puppeteer/Chromium on Windows/macOS/Linux)
- [ ] Document env vars with required vs optional and defaults
- [ ] Executor authoring guide and best practices
- [ ] Security hardening guide and incident response playbook

Observability

- [ ] Structured logs with correlation ids per execution
- [ ] Metrics: execution success rate, average phase duration, credit consumption
- [ ] Error taxonomies and dashboards for top failures
- [ ] Alerting for cron driver failures and webhook signature mismatches

Backlog & Ideas

- [ ] Marketplace for community executor/plugins
- [ ] Team features: role-based access, shared credentials with scopes
- [ ] Multi-region execution strategies and failover
- [ ] Privacy-preserving scraping modes and legal compliance helpers
- [ ] Cost reporting per workflow and forecasted credit needs

Notes

- Keep tasks linked to specific files/modules during implementation
- Prefer small, incremental PRs with tests and docs updates
