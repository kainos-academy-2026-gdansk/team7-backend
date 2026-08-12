# AGENTS.md

Operating manual for AI agents (GitHub Copilot and others) working in this repository.

If this file conflicts with a suggestion the agent "thinks" is better, **this file wins**.
If this file conflicts with the code that is already in `src/`, **the existing code wins** — report the
discrepancy instead of silently changing conventions.

---

## 1. Project

Backend REST API for an internal job-offers / job-roles website (Kainos Academy team 7).
Consumers: an admin UI (create, update, delete roles) and an applicant UI (browse and view roles).

Stack:

| Concern         | Choice                                        |
| --------------- | --------------------------------------------- |
| Runtime         | Node.js 22+                                   |
| Language        | TypeScript (strict, CommonJS, ES2020)         |
| HTTP            | Express 5                                     |
| Database        | PostgreSQL 16 via Prisma ORM                  |
| Validation      | Zod                                           |
| Logging         | Winston (app) + Morgan (HTTP, piped to Winston)|
| Tests           | Vitest + Supertest + Testcontainers           |
| Lint / format   | Biome                                         |
| CI              | GitHub Actions (`.github/workflows/ci.yml`)   |

Keep the project **simple and layered**. Do not introduce Clean Architecture, DDD, CQRS, repositories,
DI containers, factories, ports/adapters, use-case classes, or a separate domain entity layer.

---

## 2. Workflow (read this before touching code)

Every non-trivial task follows the agentic lifecycle documented in
[docs/ai/workflow.md](docs/ai/workflow.md):

```text
Memory → Intake (user story) → Planning → Implementation → Validation
       → Dev Handover (manual verification) → Retrospective → Memory update
```

Non-negotiable rules:

1. **Start by loading memory.** Read [docs/ai/memory.md](docs/ai/memory.md),
   [docs/ai/patterns.md](docs/ai/patterns.md), [docs/ai/decisions.md](docs/ai/decisions.md),
   [docs/ai/testing.md](docs/ai/testing.md) before planning.
2. **Plan before you write.** Planning is a conversation, not a monologue — see §3.
3. **Anything new needs approval.** A new dependency, a new folder, a new layer, a new endpoint shape,
   a new migration, or any deviation from §5 requires explicit developer approval first.
4. **Validate before handover.** All gates in §6 must pass.
5. **A task is not done until a human says so.** Agents never mark work as done, merged, released,
   or "Ready for QA" on their own.
6. **Close the loop.** After approval, propose a retrospective and the resulting memory update.

Dedicated agents implement the two halves of this flow:

- [.github/agents/plan-user-story.agent.md](.github/agents/plan-user-story.agent.md) — read-only:
  fetch user story → clarify → plan.
- [.github/agents/deliver-user-story.agent.md](.github/agents/deliver-user-story.agent.md) — write:
  implement → validate → handover → retrospective or re-plan.

---

## 3. Planning rules

The plan step is deliberately chatty. Before proposing a plan:

- Re-read the user story, its acceptance criteria, and the existing code it touches.
- **Ask questions about anything unclear.** Ambiguous acceptance criteria, unspecified status codes,
  unclear validation limits, unclear response shape, unclear ordering/paging, unclear nullability.
  Ask instead of assuming. Batch questions; do not drip-feed them one at a time.
- List every assumption you had to make, explicitly, in an `Assumptions` section.
- Flag every **new thing** (dependency, pattern, table, column, endpoint, config, folder) in an
  `Needs approval` section and stop until a developer approves it.

A plan is only complete when it contains:

1. Story reference and restated acceptance criteria.
2. Files to add/change, grouped by layer (`Dto` → `mappers` → `services` → `controllers` → `routes`).
3. Prisma / migration impact (or explicitly "none").
4. Test plan (service unit, controller unit, route integration).
5. Validation gates to run.
6. Assumptions, open questions, and items needing approval.
7. Rollback / risk notes if a migration or shared file is touched.

Do not start implementing while open questions or unapproved new things remain.

---

## 4. Commands

```bash
npm install            # install dependencies
npm run dev            # tsx watch src/index.ts
npm run build          # tsc -p tsconfig.json
npm start              # node dist/index.js

npm run lint           # biome lint .
npm run lint:fix       # biome lint --write .
npm run format         # biome format --write .
npm run check          # biome check --write . (lint + format)
npm run ci:check       # biome ci . (what CI runs)

npm test               # vitest run
npm run test:watch     # vitest
npm run test:coverage  # vitest run --coverage

npx tsc --noEmit -p tsconfig.json   # typecheck only

npx prisma migrate dev --name <change>   # create + apply a migration (needs approval)
npx prisma migrate deploy                # apply migrations (CI / containers)
npx prisma generate                      # regenerate Prisma Client
npx prisma db seed                       # tsx prisma/seed.ts

docker compose up -d db                  # PostgreSQL only — how we develop locally
```

During development run **only the `db` service** from compose and start the API with `npm run dev`.
The `backend` service in `docker-compose.yml` simulates production; do not use it while developing.

Route/integration tests start a PostgreSQL **Testcontainer**, so Docker must be running for
`npm test` to fully pass.

---

## 5. Architecture and conventions

### 5.1 Layout

```text
src/
├── app.ts                # express app: json → morgan → /health → routers → error handler. No listen().
├── index.ts              # entry point: dotenv/config, app.listen(PORT ?? 3000)
├── prismaClient.ts       # the single shared PrismaClient (default export)
├── controllers/          # HTTP only            (JobRoleController.ts)
├── services/             # business logic + Prisma (JobRoleService.ts)
├── routes/               # routers + dependency wiring (JobRoleRouter.ts)
├── Dto/                  # Zod schemas + request/response DTO types (JobRoleDTO.ts)
├── mappers/              # Prisma record → response DTO (JobRoleMapper.ts)
├── middlewares/          # ValidationMiddleware.ts, ErrorHandlerMiddleware.ts, morganMiddleware.ts
├── models/               # TypeScript types only (Prisma payload types). No classes, no logic.
└── lib/                  # logger.ts and other cross-cutting helpers
tests/
├── app.test.ts
├── controllers/  services/  routes/  middlewares/  Dto/
prisma/
├── schema.prisma  seed.ts  migrations/
docs/ai/                  # repository memory (see §8)
```

Naming: **PascalCase filenames matching the primary export** (`JobRoleService.ts`,
`BandController.ts`). Folder `src/Dto/` is capitalised — keep it that way; do not rename folders as a
drive-by change. Tests mirror the source folder and are named `<Module>.test.ts`.

### 5.2 Request flow

```text
HTTP → app.ts → morgan → Router → validateParams / validateBody → Controller → Service → Prisma
                                                                       ↓
                                                                    Mapper → JSON
error path: throw → next(error) → ErrorHandlerMiddleware → Winston → 400 (ZodError) | 500
```

### 5.3 Wiring

Dependencies are composed **explicitly in the router file**. No DI container, no factories.

```ts
const jobRoleService = new JobRoleService(prisma);
const jobRoleController = new JobRoleController(jobRoleService);
```

Services receive `PrismaClient` via constructor injection (`constructor(private readonly prisma: PrismaClient) {}`).
Services never import `prismaClient` directly. `prisma/seed.ts` may create its own client (separate
process) and must disconnect in `finally`.

### 5.4 Controllers

- `export class XController` with `constructor(private readonly xService: XService) {}`.
- Handlers are **arrow-function properties**: `getAll = async (req, res, next): Promise<void> => { ... }`.
- HTTP only: read `req`, call the service, map, set the status, send. Never touch Prisma.
- Everything in `try { } catch (error) { next(error); }`.
- Params arrive as strings; the controller converts with `Number(req.params.id)` after
  `validateParams(idParamSchema)` has already guaranteed the format.
- Status codes: `200` read/update, `201` create, `204` delete (empty body), `404` not found,
  `400` validation (produced by middleware), `500` from the error handler.
- Not-found body: `{ "message": "<Entity> not found" }`.

### 5.5 Services

- `export class XService` with constructor-injected `PrismaClient`.
- No `req` / `res` / `next` and no Express imports — ever.
- Return `null` for "not found"; throw for genuine errors.
- Own all Prisma access. Use `select` / `include` deliberately; do not over-fetch.
- Private helpers for internal rules (e.g. `assertRelationsExist`) stay in the service.

### 5.6 DTOs and validation

- Zod is the source of truth. Schemas live in `src/Dto/<Entity>DTO.ts`, named `<Action><Entity>Schema`.
- Derive types: `export type AddJobRoleRequestDTO = z.infer<typeof AddJobRoleSchema>;` — never duplicate
  the shape in a hand-written interface.
- Use `.strict()` so unknown fields are rejected. Response DTOs are plain interfaces.
- Request DTOs never accept `id`, `createdAt`, `updatedAt` or other server-owned fields.
- `validateBody` / `validateParams` (in `src/middlewares/ValidationMiddleware.ts`) use `safeParse` and
  return `400` with `{ errors: [{ field, message }] }`. They **do not** mutate `req`.
- Reuse the shared `idParamSchema`; do not invent per-route id schemas.

### 5.7 Mappers

Static-method classes: `JobRoleMapper.toJobRoleDetailedDto(record)`. Naming: `to<Something>Dto`.
Mappers serialise dates with `.toISOString()` and flatten relations to primitives. No business logic.

### 5.8 Errors and logging

- One global `ErrorHandlerMiddleware`, registered last in `app.ts`.
- `ZodError` → `400 { errors }`; anything else → `500`. In production the message is
  `"Internal Server Error"`; stack traces are never returned to clients.
- Log through Winston (`src/lib/logger.ts` → `logs/error.log`, `logs/all.log`). HTTP logs go through
  `morganMiddleware` into `Logger.http()`. **No `console.log` in `src/`** (Biome flags it).
- Never log secrets, credentials, tokens, or full request bodies containing personal data.

### 5.9 Style

Enforced by Biome (`biome.json`): 2 spaces, double quotes, semicolons, trailing commas, LF,
100-char lines. Also enforced as errors: `noExplicitAny`, `noNonNullAssertion`, `noUnusedVariables`,
`noUnusedImports`, `useConst`, `useAwait`, `useImportType`. Run `npm run check` instead of hand-formatting.

Comments explain *why*, in one line, only when the code cannot say it itself. Do not add doc comments,
type annotations, or refactors to code you did not otherwise change.

### 5.10 Security baseline

- All external input is validated with Zod at the route boundary.
- All database access goes through Prisma. No string-concatenated SQL.
- Secrets live in `.env` (git-ignored). Never commit credentials or paste them into chat, logs, docs,
  or memory files.
- Error responses expose no internals. See OWASP Top 10 and
  [.github/copilot-instructions.md](.github/copilot-instructions.md) for review-time checks.

---

## 6. Validation gates

Run these, in order, before any handover. Everything must be green — do not hand over "with known
failures", and never weaken a gate (no `--no-verify`, no skipped tests, no `any` to silence the compiler).

| # | Gate               | Command                              | Applies to                       |
| - | ------------------ | ------------------------------------ | -------------------------------- |
| 1 | Lint + format      | `npm run ci:check`                   | always                           |
| 2 | Typecheck          | `npx tsc --noEmit -p tsconfig.json`  | always                           |
| 3 | Unit tests         | `npm test`                           | always                           |
| 4 | Integration tests  | `npm test` (route tests, Testcontainers) | any route/schema/middleware change |
| 5 | Build              | `npm run build`                      | before PR                        |
| 6 | Migration check    | `npx prisma migrate deploy` on a fresh DB | any `schema.prisma` change   |
| 7 | Manual smoke       | `npm run dev` + Postman collection in `postman/` | new/changed endpoints |
| 8 | E2E                | not present in this repo yet         | document as N/A in handover      |

Coverage: new services, controllers and routes must ship with tests. If coverage would drop, say so in
the handover instead of hiding it.

---

## 7. Testing conventions

- Vitest, Node environment (configured via the `vitest` key in `package.json`).
- **Service tests** — mock Prisma with a hand-built object cast once:
  `const dbMock = { band: { findMany } } as unknown as PrismaClient;`. Assert the exact Prisma call
  arguments and the returned shape.
- **Controller tests** — mock the service; build `Partial<Request>` / `Partial<Response>` with
  `status: vi.fn().mockReturnThis()`, `json: vi.fn()`, `send: vi.fn()`. Assert status, payload, and
  that failures are forwarded via `next(error)`.
- **Route tests** — Supertest against the real app with a real PostgreSQL Testcontainer
  (`postgres:16-alpine`), `npx prisma migrate deploy`, then dynamic `import()` of `src/prismaClient`
  and `src/app` so they pick up `DATABASE_URL`. Timeout 120s. Stop the container in `afterAll`.
- `vi.resetAllMocks()` in `beforeEach`; `vi.restoreAllMocks()` after spying.
- Always assert that invalid input is rejected with `400` **before** the service is called.
- Test names read as behaviour: `"returns 404 when the job role does not exist"`.

---

## 8. Repository memory

Committed, team-owned memory lives in `docs/ai/` and is part of code review:

| File | Contains |
| ---- | -------- |
| [docs/ai/README.md](docs/ai/README.md) | Index, quick start, and the `user-stories.csv` contract |
| [docs/ai/memory.md](docs/ai/memory.md) | General project facts, environment gotchas, current state |
| [docs/ai/patterns.md](docs/ai/patterns.md) | Concrete code patterns to copy, and anti-patterns to avoid |
| [docs/ai/decisions.md](docs/ai/decisions.md) | Decision log (what was decided, why, alternatives) |
| [docs/ai/testing.md](docs/ai/testing.md) | Testing know-how, flakiness, container quirks |
| [docs/ai/retrospectives/](docs/ai/retrospectives/) | One file per completed task |
| [docs/ai/workflow.md](docs/ai/workflow.md) | The lifecycle itself |
| [docs/ai/mcp-planner.md](docs/ai/mcp-planner.md) | MCP / Microsoft Planner integration and guardrails |

Memory rules for agents:

- **Read** the memory files at the start of every task.
- **Propose** memory updates; never rewrite memory silently. Show a diff and wait for approval.
- Entries are short, factual, dated, one line where possible, and link to the retrospective or PR.
- If a memory entry turns out to be wrong or obsolete, propose deleting or correcting it — do not
  stack contradictory entries.
- Memory holds durable knowledge only. No secrets, no personal data, no ticket-by-ticket noise.

---

## 9. Git and delivery

- Branch from `dev`. Branch names follow the existing style: `US-012-01-add-new-role`,
  `020-delete-a-role`, `US038-linting`.
- Small, focused commits with imperative messages describing the change.
- PRs target `dev`; `dev` → `main` for release. CI (`lint`, `test`, `build`) must be green.
- `.github/CODEOWNERS` requires review from the team leads.


---

## 10. Hard limits for agents

Do **not**, without explicit approval:

- add or upgrade a dependency;
- change `prisma/schema.prisma`, create or edit a migration, or run `migrate reset` / `db push`;
- touch `.github/workflows/`, `Dockerfile`, `docker-compose.yml`, `biome.json`, `tsconfig.json`;
- delete or rewrite tests to make a suite pass;
- introduce a new architectural layer or abstraction;
- read, write, or print `.env` contents;
- change a task's status in Planner/GitHub to `Ready for QA`, `Done`, or `Released` (see
  [docs/ai/mcp-planner.md](docs/ai/mcp-planner.md));
- push to a remote or interact with a PR.

Always prefer: ask → get approval → implement.
