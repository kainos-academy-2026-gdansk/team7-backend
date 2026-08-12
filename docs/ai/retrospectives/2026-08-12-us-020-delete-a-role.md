# Retrospective — US-020 Delete a job role

> Worked example. Written retrospectively on 2026-08-12 against the already-merged
> `020-delete-a-role` work, to demonstrate the memory update flow end to end for the team. Future
> retrospectives are written at the end of the story, while the context is fresh.

| | |
| ---- | ---- |
| **Story** | `US-020-01` — As an admin I want to delete a job role so that closed roles disappear from the site |
| **Date** | 2026-08-12 (retrospective), work merged 2026-08-08 |
| **Branch / PR** | `020-delete-a-role` / #14 |
| **Agents used** | plan-user-story / deliver-user-story (the workflow they encode) |
| **Developer** | team7 |

## What was delivered

`DELETE /api/job-roles/:id` — removes a job role and returns `204` with an empty body, or `404`
`{ "message": "Job role not found" }` when the id does not exist. Invalid ids are rejected with `400`
by `validateParams(idParamSchema)` before the controller runs.

Files: `src/routes/JobRoleRouter.ts` (route + middleware), `src/controllers/JobRoleController.ts`
(`deleteJobRole`), `src/services/JobRoleService.ts` (`deleteJobRole`, returns a boolean/`null` style
result rather than throwing), plus tests in `tests/controllers/`, `tests/services/`, `tests/routes/`.

## Validation results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Lint / format (`npm run ci:check`) | pass | |
| Typecheck (`npx tsc --noEmit`) | pass | |
| Unit tests | pass | service + controller |
| Integration tests (Testcontainers) | pass | route test seeds a role, deletes it, re-reads `404` |
| Build (`npm run build`) | pass | |
| Migration on fresh DB | N/A | no schema change |
| Manual verification | approved (1 round) | Postman collection in `postman/` |
| E2E | N/A | no E2E suite in this repo |

## What went well

- Reusing `idParamSchema` meant the `400` path needed no new code and no new test scaffolding.
- Returning a "not found" signal from the service instead of throwing kept the `404` decision in the
  controller, where the HTTP concern belongs.
- The route test caught the case a mocked test would have missed: deleting a row that a previous test
  in the same container had already removed.

## What went wrong

- The first attempt returned `200` with a JSON body on successful delete. **Root cause:** the expected
  status codes were not written down anywhere the agent could read — they lived in the reviewer's head.
- The route test initially imported `src/app` at the top of the file, so Prisma bound to the developer's
  local `DATABASE_URL` instead of the container's. **Root cause:** the dynamic-import requirement was
  tribal knowledge shared verbally in an earlier story.
- Time was lost re-deriving that `validateParams` does *not* mutate `req`, so the controller still
  needs `Number(req.params.id)`. **Root cause:** an unusual convention with no written rationale.

## Rework and declines

One decline at manual verification: the reviewer asked for `204` with an empty body instead of `200`.
Cause was an ambiguous story ("the role is removed") plus missing project-wide convention — not an
agent mistake. The replan was a two-line change plus a test update.

## Time and effort signals

1 planning round, 1 question round (about cascade behaviour on related records), 2 validation
failures before green (both in the route test container setup), 1 manual verification round.

## Candidate lessons

| # | Lesson | Destination | Developer decision |
| - | ------ | ----------- | ------------------ |
| 1 | Write the project-wide status-code contract down: `200` read/update, `201` create, `204` delete with empty body, `400` validation, `404` not found, `500` unexpected. | AGENTS.md §5.4 + patterns.md | **Accepted** |
| 2 | In route tests, set `DATABASE_URL` from the container **before** dynamically importing `src/prismaClient` and `src/app`; a top-level import binds the wrong URL. | testing.md | **Accepted** |
| 3 | Record that validation middleware validates without mutating `req`, and that controllers therefore convert ids with `Number(req.params.id)`. | decisions.md (ADR-004) + patterns.md | **Accepted** |
| 4 | Services return `null` / a falsy result for expected "not found"; only genuine failures throw. | patterns.md | **Accepted** |
| 5 | Ask about cascade behaviour for every delete endpoint. | AGENTS.md | **Rejected** — too specific; belongs in the story's acceptance criteria, not in always-on guidance. |

## Proposed memory diff

Applied on 2026-08-12 after approval:

```diff
+ docs/ai/patterns.md   — "Response shapes" table (204 empty body, 404 message shape)
+ docs/ai/patterns.md   — "Service: constructor-injected Prisma, null for not found"
+ docs/ai/testing.md    — "Route tests — Testcontainers": DATABASE_URL before dynamic import
+ docs/ai/decisions.md  — ADR-004 validation middleware does not mutate req
+ AGENTS.md §5.4        — status code contract for controllers
```

Lesson 5 was rejected and deliberately left only in this file.

## Follow-ups

- [ ] Decide and document the cascade behaviour when a `Band` or `Capability` with linked job roles is
      deleted (no endpoint exists yet — capture it before one is written).
- [ ] Add `.env.example` so new contributors do not guess `DATABASE_URL`.
