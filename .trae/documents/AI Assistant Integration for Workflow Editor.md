## Objectives
- Add an AI assistant that suggests nodes, autowires edges, and generates complete workflow templates from natural-language requests.
- Provide real-time optimization tips inside the editor.
- Preserve current architecture (Next.js App Router, Prisma/PostgreSQL, React Flow) and security (Clerk + API secrets).

## Key Integration Points
- Frontend (Editor UI):
  - `app/workflow/_components/FlowEditor.tsx` — mount assistant UI (panel, chat, recommendations).
  - `app/workflow/_components/TaskMenu.tsx` — surface AI-recommended tasks and templates.
  - `lib/workflow/createFlowNode.ts` — programmatic node creation from AI suggestions.
  - `lib/workflow/executionPlan.ts` — validate AI-generated graphs pre-apply.
- Backend (Assistant services):
  - New API routes under `app/api/assistant/*`:
    - `POST /api/assistant/generate-template` — NL → workflow graph (nodes, params, edges).
    - `POST /api/assistant/suggest` — context-aware node/edge/param recommendations.
    - `POST /api/assistant/optimize` — latency/credits/data handling optimization advice.
  - New library: `lib/assistant/*`:
    - `llm.ts` — model client + prompt orchestration.
    - `graph.ts` — convert LLM output to internal graph using `TaskRegistry`.
    - `guardrails.ts` — type-safe validation with `zod` against `TaskParamType` and security rules.

## Intelligent Workflow Building
- Natural-language to graph:
  - Use LLM (existing `openai` client) to map intents to `TaskRegistry` tasks and IO.
  - Produce a structured spec (nodes, params, edges); validate with `zod` and `TaskRegistry` constraints; preview diffs before applying.
- Template generation:
  - Curate common templates (web scrape → transform → deliver; email alert; daily cron scrape).
  - Store templates as JSON graphs (`WorkflowTemplate` table or filesystem) with metadata and required credentials.
- Real-time recommendations:
  - Observe canvas state (selected node, missing inputs, invalid edges) and show contextual tips.
  - Suggest auto-wiring from available outputs; propose error handling and retries.

## System-Specific Features
- Reuse `lib/workflow/task/registry.tsx` for allowed tasks and IO types.
- Validate/plan via `lib/workflow/executionPlan.ts` (entry points, required inputs, phase ordering).
- Execute via existing engines; assistant never bypasses orchestrator.
- Respect credits accounting; show estimated cost-per-run for suggested graphs.

## Security & Compliance
- API routes secured via Clerk session for UI calls; model calls done server-side only.
- Keep `/api/assistant/*` public only if needed; prefer authenticated routes.
- Use `zod` runtime validation for env (API keys, secrets) and assistant payloads.
- Credentials: never echo secrets; assistant only references credential types, not values.
- Stripe/credits unchanged; show cost estimates, not trigger billing flows.

## User Interfaces
- Assistant Panel (dockable):
  - Chat input for NL requests; shows proposed graph preview and “Apply” button.
  - Inline explanations per node/edge; highlights impacted canvas areas.
- Recommendations Bar:
  - Context-sensitive suggestions (add Filter, add Error Handler, add Webhook).
- Guided Builder:
  - Step-by-step wizard: pick entry point, choose data ops, choose delivery; creates validated graph.
- Visual Editor Integration:
  - One-click auto-wire compatible outputs to missing inputs.
  - Warnings for cycles and incompatible types using existing validators.

## Workflow Patterns Support
- Sequential & conditional: leverage existing tasks (`Conditional`, `Loop`).
- Parallelism (new):
  - Extend planning to support `ParallelGroup` phases; run compatible nodes with `Promise.all` and per-group resource guard.
  - Concurrency limits and Puppeteer resource locking (browser/page isolation).
- Error handling nodes:
  - Add “Try/Catch” and “Retry with backoff” as tasks; assistant recommends them.

## Third-Party Integrations
- Expand connectors gradually via task executors:
  - Slack webhook, Google Sheets (API key/OAuth), Discord webhook, generic REST.
  - Use existing `CredentialsParam` and `lib/credential` for storage.
- Template examples include integrations and explain credential setup.

## Custom Node Creation
- SDK-like pattern:
  - Scaffold executor in `lib/workflow/executor/*` and register via `lib/workflow/executor/registry.ts`.
  - Define node params/IO in `lib/workflow/task/registry.tsx`.
  - Assistant can propose scaffolds from NL specs; generates files and tests (after approval).

## Monitoring & Error Handling
- UI for execution monitoring:
  - Live logs per phase using `ExecutionLog`; stream into editor sidebar.
  - Status, duration, output previews with redaction for large payloads.
- Observability (optional): integrate Sentry for error traces; PostHog for product analytics.
- Built-in error tasks: Try/Catch, Retry; assistant recommends based on failure points.

## Data Transformation & Manipulation
- Use existing Data tasks; assistant auto-inserts transform/filter/map steps.
- Provide schema-aware suggestions using `zod` schemas for JSON IO.

## Implementation Milestones
- Phase 1: Assistant foundations
  - Backend: `/api/assistant/*`, `lib/assistant/{llm,graph,guardrails}` with `zod` validation.
  - Frontend: Assistant Panel and Recommendations Bar integrated into `FlowEditor`.
  - Template gallery: minimal curated templates.
- Phase 2: Pattern coverage & optimization
  - Parallelism in `executionPlan` + `executionWorkflow` with resource guards.
  - Error handling tasks (Try/Catch, Retry) and assistant recommendations.
- Phase 3: Integrations & custom nodes
  - New connectors (Slack, Sheets, Discord, REST) with credential types.
  - Guided Builder wizard and node scaffolding flow for custom tasks.
- Phase 4: Monitoring & polish
  - Live execution monitor UI; cost estimate UX; Sentry/PostHog optional.
  - UX refinements, accessibility, docs, and tests.

## Validation & Tests
- Unit tests: graph conversion, guardrails, parallel plan construction, executor correctness.
- Integration tests: NL → template → canvas apply → validate → execute → logs.
- Security tests: payload validation, credential handling, route protection.

## Assumptions & Risks
- OpenAI or equivalent model available; usage metered and server-side only.
- Parallel execution must protect Puppeteer resources; introduce concurrency limits.
- Credential/OAuth for new connectors may require additional UI flows.

If this plan looks good, I will proceed to implement Phase 1 (backend routes, guardrails, frontend panel) and wire it to the existing `TaskRegistry` and planner for safe, validated application of AI-generated workflows.