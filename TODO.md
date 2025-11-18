Automation SaaS — TODO & Roadmap (n8n/Zapier‑style)

Vision

- Build a multi‑tenant automation platform with visual workflows, rich integrations, triggers, and an execution engine. Scraping/browser nodes remain first‑class, but the system focuses on general automation (HTTP/API, data mapping, AI, and app integrations), reliability, observability, and monetization.

Core Engine

- [ ] Workflow model: nodes, edges, inputs/outputs, variables, data mapping [P0]
  - Linked files: `lib/workflow/executionWorkflow.ts:40`, `lib/workflow/executionPlan.ts:1`, `types/appNode.ts:1`
  - DoD: JSON graph schema with validation, typed inputs/outputs, variables/state across phases
- [ ] Triggers: HTTP webhook, schedule/cron, manual, incoming email/IMAP [P0]
  - Linked files: `app/api/workflows/execute/route.ts:31`, `app/api/workflows/cron/route.ts:12`, `actions/workflows/runWorkflow.ts:1`
  - DoD: secure webhooks (signing + idempotency), cron driver, UI trigger buttons
- [ ] Retry/backoff, idempotency, DLQ [P0]
  - Linked files: `lib/workflow/retry.ts:22`, `lib/idempotency.ts:1`, `prisma/schema.prisma:56`
  - DoD: per‑node policies, output fingerprint dedupe, DLQ view with re‑run
- [ ] Concurrency + worker pool per resource type [P0]
  - Linked files: `lib/workflow/workerPool.ts:133`, `lib/workflow/concurrency.ts:1`
  - DoD: browser/page/other pools, metrics and backpressure handling
- [ ] Data mapping & expressions (JSONPath/JMESPath, templating) [P1]
  - Linked files: `lib/workflow/helpers.ts:1`, `types/TaskType.ts:1`
  - DoD: map node outputs to inputs via expressions; preview mapping in editor
- [ ] Sub‑workflows, loops, conditional branches [P1]
  - Linked files: `lib/workflow/executor/ConditionalLogicExecutor.ts:1`, `lib/workflow/executor/LoopExecutor.ts:1`
  - DoD: call subflows, for‑each loops over arrays, branch by expression
- [ ] Pause/resume/cancel, checkpoints [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:169`, `actions/workflows/**`
  - DoD: state persisted and resumable; cancel signals propagate

Editor UX

- [ ] Canvas with node library, search, examples [P0]
  - Linked files: `app/workflow/_components/TaskMenu.tsx:1`, `app/workflow/_components/Editor.tsx:1`
  - DoD: searchable catalog, quick‑add, usage examples inline
- [ ] Node config forms with validation, test node [P0]
  - Linked files: `app/workflow/_components/NodeInputs.tsx:1`, `app/workflow/_components/NodeParamField.tsx:1`
  - DoD: client validation, run single node against sample data
- [ ] Data inspector and execution timeline [P1]
  - Linked files: `app/workflow/runs/[workflowId]/[executionId]/_components/ExecutionViewer.tsx:78`
  - DoD: phase logs, inputs/outputs, retry info, worker metrics
- [ ] Variables panel and secrets injection [P1]
  - Linked files: `components/context/FlowValidationContext.tsx:1`, `actions/credentials/**`
  - DoD: environment vars, workflow vars, secret references resolved at runtime

Integrations & Nodes

- [ ] HTTP Request (GET/POST/etc.), GraphQL [P0]
  - Linked files: `lib/workflow/executor/RestRequestExecutor.ts:7`, `lib/workflow/executor/GraphQLQueryExecutor.ts:17`
  - DoD: headers/body, auth, browser/non‑browser context, error handling
- [ ] Webhook (incoming/outgoing) [P0]
  - Linked files: `app/api/**`, `lib/workflow/executor/DeliverViaWebhookExecutor.ts:1`
  - DoD: validate signatures, retries/backoff, dedupe
- [ ] Slack/Discord/Teams, Email (SMTP) [P1]
  - Linked files: `lib/workflow/executor/SendEmailExecutor.ts:1`, `lib/workflow/executor/RestRequestExecutor.ts:7`
  - DoD: message send nodes with credential types and failure surface
- [ ] Google Sheets/Drive, Notion, Airtable, Trello, Asana [P2]
  - Linked files: `lib/workflow/executor/RestRequestExecutor.ts:7`, `actions/credentials/**`
  - DoD: minimal CRUD nodes with OAuth credentials, pagination helpers
- [ ] Databases (Postgres/MySQL) query nodes [P2]
  - Linked files: `lib/prisma.ts:1`, `lib/workflow/executor/EvaluateScriptExecutor.ts:4`
  - DoD: parameterized queries, row streaming, connection pooling
- [ ] Browser automation (click, type, upload, scrape) [P0]
  - Linked files: `lib/workflow/executor/**`
  - DoD: robust selectors, retries, resource blocking, screenshots/artifacts
- [ ] AI nodes: LLM decision, extraction, summarization, tool calls [P1]
  - Linked files: `lib/workflow/executor/ExtractDataWithAIExecutor.ts:7`
  - DoD: schema‑locked JSON outputs, deterministic prompts, cost tracking

Triggers

- [ ] Webhook triggers with signing & IP allowlists [P0]
  - Linked files: `app/api/workflows/execute/route.ts:31`, `middleware.ts:10`
  - DoD: per‑tenant secrets, replay prevention via idempotency, rate limits
- [ ] Cron schedules with blackout/windows [P1]
  - Linked files: `app/api/workflows/cron/route.ts:12`, `lib/cron/scheduleParser.ts:1`
  - DoD: schedule validation, preview, next‑run computation, blackout handling
- [ ] Email (IMAP) trigger [P2]
  - Linked files: `actions/**`
  - DoD: new message filters, attachments, dedupe

Credentials & Security

- [ ] Multi‑tenant org/workspace, RBAC (admin/editor/viewer) [P0]
  - Linked files: `prisma/schema.prisma:13`, `middleware.ts:10`, `actions/**`
  - DoD: roles enforcement across UI/API, scoped credentials
- [ ] Per‑tenant API keys (hashed), scoped tokens [P0]
  - Linked files: `app/api/**`, `middleware.ts:10`
  - DoD: Bearer verification, scope checks, rotation
- [ ] Credential vault: encryption, audit, masking [P0]
  - Linked files: `prisma/schema.prisma:91`, `lib/encryption.ts:1`, `lib/credential/**`
- [ ] OAuth provider credentials (Google/Slack/Notion/etc.) [P1]
  - Linked files: `actions/credentials/**`
  - DoD: OAuth flow, refresh, scopes, usage auditing

Billing & Plans

- [ ] Stripe subscriptions & credit metering [P0]
  - Linked files: `app/api/webhooks/stripe/route.ts:10`, `lib/stripe/handleCheckoutSessionCompleted.ts:1`, `prisma/schema.prisma:86`
  - DoD: plan tiers map to credits; consumption tracked per execution/node
- [ ] Usage dashboards & alerts [P1]
  - Linked files: `actions/analytics/**`, `app/(dashboard)/(home)/page.tsx:1`

Public API & SDK

- [ ] Public API for workflows/executions/artifacts [P1]
  - Linked files: `app/api/**`, `types/workflow.ts:1`, `lib/workflow/executionWorkflow.ts:169`
  - DoD: CRUD workflows, trigger runs, stream logs/results, fetch artifacts
- [ ] TypeScript SDK package [P2]
  - Linked files: `types/**`, `app/api/**`
  - DoD: typed clients, auth helpers, examples, npm publish

Observability

- [ ] Structured logs, correlation ids, dashboards [P1]
  - Linked files: `lib/log.ts:1`, `types/log.ts:1`, `actions/analytics/**`
- [ ] Metrics: success rate, durations, credit burn [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:169`
- [ ] Alerts for cron driver/webhook failures [P1]
  - Linked files: `app/api/workflows/cron/route.ts:12`, `app/api/webhooks/stripe/route.ts:10`

Performance & Scaling

- [ ] Worker processes and job queue (BullMQ/Rabbit) [P1]
  - Linked files: `lib/workflow/workerPool.ts:133`
  - DoD: queue per tenant, scaling workers horizontally, backpressure
- [ ] Multi‑region execution and failover [P2]
  - Linked files: `lib/network/proxyManager.ts:169`
  - DoD: region routing, proxy health checks, failover

DevOps & CI/CD

- [ ] CI pipeline: lint, typecheck, tests, build [P0]
  - Linked files: `package.json:5`, `.eslintrc.json:1`, `vitest.config.ts:1`
- [ ] Docker + compose for local Postgres [P1]
  - Linked files: `prisma/schema.prisma:8`
- [ ] Release strategy and environment promotion [P2]

Templates & Onboarding

- [ ] Template gallery (lead qualification, support triage, data sync) [P1]
  - Linked files: `lib/workflow/templates.ts:1`, `app/workflow/_components/TaskMenu.tsx:1`
- [ ] Onboarding checklist and sample import [P1]
  - Linked files: `app/setup/page.tsx:1`

Testing

- [ ] Unit tests: orchestration, credits, idempotency [P1]
  - Linked files: `lib/workflow/executionWorkflow.ts:40`, `lib/workflow/creditCheck.ts:1`, `lib/idempotency.ts:1`
- [ ] Integration tests: cron, webhook triggers, selectors [P1]
  - Linked files: `app/api/workflows/cron/route.ts:12`, `app/api/workflows/execute/route.ts:31`, `lib/selector/**`
- [ ] E2E: editor create→run→inspect [P1]
  - Linked files: `app/workflow/_components/Editor.tsx:1`, `app/workflow/runs/**`

Documentation

- [ ] Env var docs (required vs optional) [P0]
- [ ] Executor authoring guide (plugin API) [P1]
- [ ] Security and incident response playbook [P2]

Backlog & Ideas

- [ ] Marketplace for nodes/plugins [P3]
- [ ] Offline runs with resume/checkpointing [P3]
- [ ] Visual diffs for HTML snapshots [P3]
