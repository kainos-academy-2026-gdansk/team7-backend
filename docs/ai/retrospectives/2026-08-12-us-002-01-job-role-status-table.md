# Retrospective — US-002-01 Job role status table and detail columns

| | |
| ---- | ---- |
| **Story** | `US-002-01` — View job role information (missed database acceptance criterion) |
| **Date** | 2026-08-12 |
| **Branch / PR** | `db-refactor` / not yet raised |
| **Agents used** | none — worked directly in chat, no plan file |
| **Developer** | wiktorlemanski |

## What was delivered

The database acceptance criterion that had been skipped when `GET /api/job-roles/:id` was first built:
`JobRole` now carries `description`, `responsibilities`, `sharepointUrl`, `numberOfOpenPositions` and
a `statusId` foreign key, and a `Status` lookup table (`statusId`, `statusName`) replaces the
`JobRoleStatus` enum. `openPositions` → `numberOfOpenPositions` and `sharePointLink` → `sharepointUrl`
were renamed in the database and throughout the code.

A status slice was added alongside band and capability — `StatusService` → `StatusController` →
`StatusRouter`, exposed as `GET /api/statuses` — and every job-role response now returns the joined
`status` name instead of an id, matching how `band` and `capability` are already flattened.

Migration: `prisma/migrations/20260812120000_job_role_status_table/`, hand-written to preserve data.

A local static code review (`code_reviews/db-refactor-2026-08-12.md`, verdict Amber) was run after
implementation and its three medium findings were fixed in the same branch: `AddJobRoleRequestSchema`
is now `.strict()`, the seed no longer creates `Status` rows, and the Postman collection was
consolidated into one file covering every endpoint.

## Validation results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Lint / format (`npm run ci:check`) | pass | 45 files |
| Typecheck (`npx tsc --noEmit`) | pass | |
| Unit tests | pass | service, controller, DTO, middleware |
| Integration tests (Testcontainers) | pass | 169 tests / 15 files after the review fixes (167 before) |
| Build (`npm run build`) | pass | |
| Migration on fresh DB | pass | applied in the Testcontainer from an empty database |
| Migration on existing data | pass | dev DB verified: 21 OPEN / 2 CLOSED rows backfilled |
| Seed after the review fix | pass | `npx prisma db seed` with statuses owned by the migration |
| Static code review | Amber → findings fixed | `code_reviews/db-refactor-2026-08-12.md` |
| Manual verification | pending | |
| E2E | N/A | no E2E suite in this repo |

## What went well

- Hand-writing the migration instead of accepting Prisma's generated version preserved every existing
  row; the generated version would have dropped the enum column and its data.
- Verifying the backfill with a `GROUP BY` against the dev database caught nothing, but proved the
  data path — cheap and worth repeating for any column-replacing migration.
- The route tests running `migrate deploy` from an empty container proved the whole migration chain,
  not just the final schema.
- Copying the Band slice verbatim made the status endpoint a five-minute job with no design debate.
- Running the static code review **after** a fully green suite paid for itself: all 167 tests passed
  while `POST` was silently dropping renamed fields. The review, not the tests, caught it.

## What went wrong

- **The acceptance criterion was missed entirely the first time.** The endpoint shipped, was reviewed
  and merged without the database columns the story asked for. **Root cause:** acceptance criteria
  were not restated and ticked off one by one before the work was called done.
- **The hand-edited schema did not compile** — `enum Status` collided with `model Status`, `statusId`
  was declared as a relation field rather than an `Int` FK plus relation, `@@index([status])` pointed
  at a removed field, and the back-relation was missing. **Root cause:** editing Prisma by hand
  without running `npx prisma validate`, which finds all four in under a second.
- **Contract decision churn.** The response shape was decided as `statusId: number`, implemented
  across DTOs, mapper, service and every test, then reversed to the joined `status` name minutes
  later. **Root cause:** the question was asked in isolation instead of being answered by the
  convention already in the codebase — `band` and `capability` were already flattened to names.
- **`prisma migrate dev --create-only` was piped through `tail`**, which hid its interactive
  data-loss prompt; the command sat there until it was killed.
- **A Prisma update input mixed checked and unchecked forms** (`statusId` alongside `band: { connect }`),
  which fails to compile with a long, unhelpful union error.
- **Stale test fixtures failed confusingly.** List fixtures without the new `status` relation made the
  mapper throw a `TypeError`, which the controller forwarded to `next(error)` — the test reported
  "json was not called" rather than the real cause.
- **A green suite hid a contract regression.** `AddJobRoleRequestSchema` was not `.strict()` while
  `updateJobRoleSchema` was, so renaming two fields turned every stale `POST` into a silent write of
  `null`. Nothing failed — there was no test asserting that unknown keys are rejected on create.
  **Root cause:** the two schemas in the same file had drifted apart on strictness, and the rename
  was only checked from the new-name side.
- **Reference data was created twice.** The migration inserted `OPEN`/`CLOSED` and `prisma/seed.ts`
  did the same with `skipDuplicates`. Because `statusId` is `SERIAL`, any future divergence would
  give the same status name a different id per environment — and `PUT` takes ids.
  **Root cause:** the seed was updated by analogy with bands and capabilities without asking who
  owns rows that a foreign key depends on.
- **The Postman collection had rotted long before this branch.** It covered only `/health` and
  `GET /:id`, split across two files, so it could not have served as the manual smoke test that
  AGENTS.md §6 gate 7 assumes.

## Rework and declines

No formal decline. One self-inflicted rework cycle (statusId → status name) touching four source files
and four test files. Prevented by reading the existing response DTOs first.

A second, cheaper cycle followed the static code review: three medium findings, all fixed in the same
branch, adding two tests and removing one that had asserted the permissive behaviour.

## Time and effort signals

0 planning rounds (no plan file), 1 question round of 3 batched questions, 1 follow-up reversing one
of those answers, 3 compile/validate failures before green, 1 hung terminal command, 1 failing test
after the second contract change, 1 review round producing 3 medium findings and 4 nitpicks.

## Candidate lessons

| # | Lesson | Destination | Developer decision |
| - | ------ | ----------- | ------------------ |
| 1 | Restate each acceptance criterion as a checklist and tick it off in the handover; a story is not done until every criterion, including database ones, is evidenced. | AGENTS.md §3 / workflow.md | Pending |
| 2 | Run `npx prisma validate` (and `npx prisma format`) after every hand edit to `schema.prisma`, before anything else. | testing.md or memory.md | Pending |
| 3 | Replacing or renaming a populated column needs a hand-written migration: create → backfill → set NOT NULL → drop old. Prisma's generated migration drops data. Verify with a `GROUP BY` on the dev database afterwards. | patterns.md + decisions.md | Pending |
| 4 | Prisma update/create input cannot mix a scalar FK (`statusId`) with a nested relation write (`band: { connect }`). Use `status: { connect: { statusId } }` when other relations are connected. | patterns.md | Pending |
| 5 | Never pipe `prisma migrate dev` (or any interactive CLI) through `tail`/`head` — the prompt is hidden and the command hangs. | testing.md or memory.md | Pending |
| 6 | Response DTOs flatten relations to their human-readable name (`band`, `capability`, `status`), never their id. Ids belong in requests. Read the neighbouring DTO before asking how a new field should be shaped. | patterns.md | Pending |
| 7 | Lookup tables get their own read-only slice (`XService` → `XController` → `XRouter`, `GET /api/xs`) copied from `BandService`. | patterns.md | Pending |
| 8 | A cross-cutting schema change should go through the plan agent first; this one was worked ad hoc and the contract churn was the price. | workflow.md | Pending |
| 9 | Every request schema is `.strict()` — including create schemas. A non-strict schema turns a field rename into silent data loss instead of a `400`. | AGENTS.md §5.6 + patterns.md | Pending |
| 10 | Renaming a request field ships with a test proving the **old** name is now rejected, not only that the new one is accepted. | testing.md | Pending |
| 11 | Reference data that a foreign key points at is created in exactly one place — the migration. Seeds read it and fail loudly if it is missing; `SERIAL` ids diverge per environment otherwise. | patterns.md + memory.md | Pending |
| 12 | Run the static code review after the gates are green but before handover. A passing suite proves the code does what the tests say, not that the contract is still safe. | workflow.md | Pending |
| 13 | The Postman collection is part of the definition of done for any endpoint change — one collection file, folders per resource, one request per status code. | AGENTS.md §6 gate 7 | Pending |

## Proposed memory diff

Awaiting approval — the full diff for `patterns.md`, `testing.md`, `decisions.md` (ADR-008) and
`AGENTS.md` was presented in chat and has **not** been applied.

One line was applied already, as the fix for review finding 2 rather than as a memory promotion:
`docs/ai/memory.md` now records that migration `20260812120000_job_role_status_table` owns the
`Status` rows and that the seed must never create them, plus the `GET /api/statuses` row in the
endpoint table.

## Follow-ups

- [ ] Decide whether `PUT /api/job-roles/:id` should take `statusName` for symmetry with
      `bandName` / `capabilityName`, or keep `statusId`.
- [ ] Update the frontend repository: two fields renamed, `PUT` now requires `statusId`, `POST`
      rejects unknown keys, and `GET /api/statuses` supplies the dropdown options.
- [x] Update `postman/` with the new request/response shapes and the `/api/statuses` endpoint —
      consolidated into `postman/kainos-project-team7.json`, one request per status code, with
      `pm.test` assertions; the duplicate `- get byID` file was deleted.
- [x] Confirm the source of truth for `Status` rows — the migration owns them; the seed now only
      reads them and throws `Status not found: OPEN` if migrations have not run.
- [ ] Apply the approved memory lessons, then re-run the gates.
- [ ] Nothing is committed yet: the whole change is working tree plus untracked files.
