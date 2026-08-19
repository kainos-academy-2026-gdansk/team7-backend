# Repository memory — decisions

Lightweight decision log. One entry per decision that a future contributor (or agent) could
reasonably question. Newest at the bottom. Never delete an entry — supersede it with a new one and
mark the old entry `Superseded by ADR-xxx`.

Format: **ID · date · title · status · context · decision · consequences · alternatives.**

---

## ADR-001 · 2026-08-04 · Layered Express structure, no repositories

**Status:** Accepted

**Context.** The team is early-career and the domain is small (three entities). Heavier architectures
add indirection that slows learning and review.

**Decision.** Use `routes → controllers → services → Prisma` with `Dto` (Zod) and `mappers` at the
edges. No repository layer, DI container, factories, Clean Architecture, DDD or CQRS.

**Consequences.** Services depend on Prisma types directly; swapping the ORM would touch every
service. Accepted — the project is not expected to change database technology.

**Alternatives.** Repository pattern (rejected: extra layer with no current benefit), NestJS
(rejected: framework learning cost outweighs the gain for a small API).

---

## ADR-002 · 2026-08-04 · Explicit dependency wiring in router files

**Status:** Accepted

**Context.** Services need a `PrismaClient`; tests need to substitute it.

**Decision.** Services take `PrismaClient` in the constructor. Composition happens in the router file:
`new JobRoleService(prisma)` then `new JobRoleController(jobRoleService)`.

**Consequences.** Wiring is visible and greppable; unit tests inject a mock without module mocking.
Router files carry a little setup code.

**Alternatives.** Service importing the singleton directly (rejected: hidden global, harder to test);
DI container (rejected by ADR-001).

---

## ADR-003 · 2026-08-05 · Zod schemas are the single source of truth for request contracts

**Status:** Accepted

**Context.** Duplicated request interfaces drift away from validation rules.

**Decision.** Define `.strict()` Zod schemas in `src/Dto/`, derive request types with `z.infer<...>`,
and keep response DTOs as plain interfaces produced by mappers.

**Consequences.** One place to change a contract; unknown fields are rejected by default. Response
shapes still need mapper updates when the schema changes.

**Alternatives.** class-validator / DTO classes (rejected: decorators plus a second type system).

---

## ADR-004 · 2026-08-05 · Validation middleware validates without mutating `req`

**Status:** Accepted

**Context.** Coercing params inside middleware changes the Express types and forces casts such as
`req.params = parsed as any`.

**Decision.** `validateBody` / `validateParams` use `safeParse`, respond `400` with
`{ errors: [{ field, message }] }` on failure, and otherwise call `next()` leaving `req` untouched.
Controllers convert ids with `Number(req.params.id)`.

**Consequences.** No `any` casts anywhere in the middleware; the cost is one explicit `Number(...)`
per controller handler. Uniform, field-level validation errors for the frontend.

**Alternatives.** Replacing `req.body`/`req.params` with parsed data (rejected: needs `as any` and
fights Express 5 types).

---

## ADR-005 · 2026-08-07 · Route tests run against a real PostgreSQL Testcontainer

**Status:** Accepted

**Context.** Mocked-service route tests miss Prisma query mistakes, migration drift, and constraint
violations.

**Decision.** Route tests start `postgres:16-alpine` via `@testcontainers/postgresql`, set
`DATABASE_URL`, run `npx prisma migrate deploy`, then dynamically import `src/prismaClient` and
`src/app`. Service and controller tests stay fully mocked.

**Consequences.** Real coverage of the full HTTP path, at the cost of requiring Docker locally and in
CI and a 120s container timeout. Contributors without Docker cannot run the full suite.

**Alternatives.** SQLite in memory (rejected: dialect differences vs PostgreSQL); mocking Prisma at
route level (rejected: no confidence in queries or migrations).

---

## ADR-006 · 2026-08-12 · Adopt an agentic development workflow with committed repository memory

**Status:** Accepted

**Context.** AI assistance was ad hoc: each session restarted from zero, conventions were re-derived
from scratch, and quality depended on who was prompting.

**Decision.** Adopt the lifecycle in [workflow.md](workflow.md)
(memory → intake → plan → implement → validate → manual verification → retrospective → memory update),
with `AGENTS.md` and `.github/copilot-instructions.md` as always-on guidance, `docs/ai/` as committed
team memory, and two custom agents splitting the read (plan) and write (deliver) halves.

**Consequences.** A little process overhead per story; in exchange, agents start with project context,
plans are reviewed before code exists, and lessons accumulate in git and are reviewed like code.

**Alternatives.** Personal, user-level Copilot instructions (rejected: not shared, not reviewable);
a single all-purpose agent (rejected: planning agent with write access edits before approval).

---

## ADR-007 · 2026-08-12 · Microsoft Planner via MCP is read-mostly; humans own status transitions

**Status:** Accepted

**Context.** Agents could read task context and post progress from Planner, but automated status
changes would let an agent declare its own work finished.

**Decision.** Enable Planner MCP for reading task context and appending progress notes / handover
summaries. Status transitions to `Ready for QA`, `Done` or `Released` remain human-only. Details and
guardrails in [mcp-planner.md](mcp-planner.md).

**Consequences.** Planner stays a trustworthy signal of real progress. Agents still have to draft
handover notes that a human posts or approves.

**Alternatives.** Full write access (rejected: no human gate); no integration (rejected: loses the
value of task context in intake).

---

## ADR-008 · 2026-08-13 · Development authentication bootstrap credentials are not production credentials

**Status:** Accepted

**Context.** Local and Postman verification needs a development ADMIN account, but a reusable password
literal in seed code can be mistaken for a deployment credential.

**Decision.** The seeded ADMIN account is development-only and must never be reused in production.
Bootstrap credentials must be moved to an environment-provided value before production use; secrets
must not be committed to source or documentation.

**Consequences.** Local setup needs an explicit credential configuration step, and the current literal
seed password remains a follow-up to replace before deployment.

**Alternatives.** Keep a shared literal (rejected: predictable and easy to reuse); add a public promotion
endpoint (rejected: privilege-escalation risk and outside the story scope).

---

## ADR-009 · 2026-08-13 · Reuse the Status table for application lifecycle states

**Status:** Accepted

**Context.** US050/US051 requires application states, while the repository already uses a shared
`Status` lookup table for JobRole states. The database-only scope does not justify a second lookup
table or a new enum.

**Decision.** Store `Application.statusId` as a foreign key to `Status`. Keep `OPEN` and `CLOSED` for
JobRole and add `IN_PROGRESS`, `HIRED`, and `REJECTED` for Application in the application migration.
Application services must validate the status names allowed for their entity.

**Consequences.** One lookup table is reused and status IDs remain environment-independent when
resolved by name, but the database FK alone cannot prevent a JobRole from referencing an application
status or an Application from referencing a JobRole status.

**Alternatives.** New `ApplicationStatus` enum (rejected: user requested the existing table); separate
application status table (rejected: unnecessary duplication for the current scope).

---

## ADR-010 · 2026-08-13 · Deleting a JobRole cascades linked applications

**Status:** Accepted

**Context.** US050/US051 permits a recruitment admin to remove a JobRole, and the product decision is
that all applications connected to that role should be removed as well. The existing application FK
used `RESTRICT`, which would have exposed an uncontrolled database error from the existing delete path.

**Decision.** Configure `Application.jobRoleId` with `ON DELETE CASCADE`. Keep `Application.applicantId`
and `Application.statusId` restrictive. The later API/UI workflow must require explicit admin confirmation
before deletion; optional notifications are a post-commit concern and are outside this database change.

**Consequences.** Role deletion is atomic and cannot leave orphaned applications, but application history
is permanently removed. A future archive/soft-delete policy would require a deliberate schema change.

**Alternatives.** Keep `RESTRICT` (rejected: deletion fails after applications exist); soft delete/archive
(deferred: product explicitly chose deletion for this workflow).

---

## ADR-011 · 2026-08-13 · Application assessment transitions are transactional

**Status:** Accepted

**Context.** Hiring changes an application's status and the related JobRole's position count. Separate
updates could leave the records inconsistent or allow a repeated/concurrent transition to decrement
positions more than once.

**Decision.** Resolve application status IDs by name and perform HIRE/REJECT transitions in a Prisma
transaction. Only `IN_PROGRESS` applications may change; HIRE also conditionally decrements a positive
position count. Invalid transitions and unavailable positions return `409`.

**Consequences.** The operation is atomic and safe against stale state at the update boundary. The
shared Status table still requires service-level validation; automatic JobRole closure remains US055.

**Alternatives.** Independent updates (rejected: partial-write risk); frontend-only state check
(rejected: clients cannot enforce database integrity).
