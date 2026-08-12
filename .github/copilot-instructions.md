# Copilot instructions — team7-backend

The full engineering and agent operating manual is [AGENTS.md](../AGENTS.md). **Read it first.**
This file only adds what Copilot needs on every request plus the code-review checklist.

## Always

- Node.js + Express 5 + TypeScript (strict) + Prisma/PostgreSQL + Zod + Vitest. Biome for lint/format.
- Layers: `routes` → `controllers` → `services` → Prisma, with `Dto` (Zod) and `mappers` at the edges.
  No repositories, DI containers, factories, Clean Architecture, DDD or CQRS.
- Follow the agentic lifecycle in [docs/ai/workflow.md](../docs/ai/workflow.md):
  memory → intake → plan → implement → validate → manual verification → retrospective → memory update.
- Load repository memory before planning: [docs/ai/memory.md](../docs/ai/memory.md),
  [docs/ai/patterns.md](../docs/ai/patterns.md), [docs/ai/decisions.md](../docs/ai/decisions.md),
  [docs/ai/testing.md](../docs/ai/testing.md).
- Ask questions when a requirement is ambiguous. Anything genuinely new to the project
  (dependency, layer, migration, endpoint shape, config change) needs explicit approval.
- Before claiming work is finished: `npm run ci:check`, `npx tsc --noEmit -p tsconfig.json`,
  `npm test`, `npm run build`.
- Never mark a task Done / Ready for QA / Released, never push, and never open or merge a PR
  without a human asking for it.

## Never

- `console.log` in `src/`, `any`, non-null assertions, or unused imports (Biome errors).
- Prisma calls in controllers; Express types (`req`/`res`/`next`) in services.
- Deleting or skipping tests to make a suite green.
- Committing secrets, or reading/echoing `.env`.

## Code review checklist

Review PRs against these. Explain **why** an issue matters and point toward the fix rather than
rewriting the author's code — see [copilot-review-instructions.md](copilot-review-instructions.md)
for tone (the team are trainees).

**Layering**

- Controllers do HTTP only: read the request, call the service, map, set status, respond. Flag business
  logic or Prisma access in a controller.
- Services hold business logic and all Prisma access, and know nothing about HTTP.
- Routers stay thin: middleware + one controller method per endpoint, plus the explicit
  `new XService(prisma)` / `new XController(xService)` wiring.
- Mappers are static-method classes converting Prisma records to response DTOs. No logic beyond mapping.
- `app.ts` configures Express and exports the app; only `index.ts` calls `listen()`.

**Contracts and validation**

- Every `req.body` / `req.params` is validated by a Zod schema via `validateBody` / `validateParams`
  before the controller runs. Flag controllers trusting raw input.
- Schemas use `.strict()`; request DTO types are `z.infer<...>`, not duplicated interfaces.
- Request DTOs never accept server-owned fields (`id`, `createdAt`, `updatedAt`). Response DTOs never
  leak internal state.
- Reuse the shared `idParamSchema` instead of new per-route id schemas.

**Behaviour**

- Status codes: `200` read/update, `201` create, `204` delete with empty body, `400` validation,
  `404` not found, `500` unexpected. Flag `200` responses carrying an error.
- Validation errors use `{ errors: [{ field, message }] }`; not-found uses `{ message: "<Entity> not found" }`.
- Prisma `findUnique` returns `null`, not `undefined` — flag `=== undefined` checks.
- Async handlers are wrapped in `try/catch` and forward failures with `next(error)`. Flag swallowed
  errors and empty catch blocks.
- Services return `null` for expected "not found" and throw only for genuine errors.

**Naming and readability**

- Files PascalCase matching the primary export (`JobRoleService.ts`). Classes PascalCase nouns,
  methods camelCase verbs, constants UPPER_SNAKE_CASE, booleans phrased as questions (`isOpen`).
- Route paths are lowercase plural nouns (`/api/job-roles`), never verbs.
- Flag names that hide intent, abbreviations, and comments restating the code.

**Tests**

- New/changed service, controller or route code ships with tests in the mirrored `tests/` folder.
- Service tests mock Prisma; controller tests mock the service; route tests use Supertest against the
  real app with a PostgreSQL Testcontainer.
- Tests assert that invalid input is rejected before the service is reached.
- Flag tests that assert implementation details instead of behaviour, and mocks left un-reset.

**Security (OWASP Top 10)**

- No raw SQL with interpolated input; Prisma parameterises queries.
- No secrets, connection strings or tokens in code, tests, logs or docs.
- No stack traces or internal messages in HTTP responses.
- No unvalidated input reaching the database, the filesystem or a shell command.
- Authorisation checks must not be disabled "for dev/test".

**Migrations and config**

- `prisma/schema.prisma` changes must come with a migration in `prisma/migrations/` and a note in the
  PR description. Flag schema edits without migrations.
- Changes to CI, Docker, Biome or tsconfig need an explicit reason in the PR description.
