# Retrospective — US051 (follow-up) Move job-role admin writes into AdminRouter

| | |
| ---- | ---- |
| **Story** | `US051` — Assess role applications (follow-up: consolidate job-role writes into `AdminRouter`) |
| **Date** | 2026-08-17 |
| **Branch / PR** | `admin-refacor-hot-fix` (pushed to origin) / not opened |
| **Agents used** | None formally invoked — conversational implementation in the same session; `plan-user-story` / `deliver-user-story` were not used |
| **Developer** | Not recorded |

## What was delivered

Moved the three ADMIN-only job-role write routes — `POST /api/job-roles`, `PUT /api/job-roles/:id`,
`DELETE /api/job-roles/:id` — out of `src/routes/JobRoleRouter.ts` into `src/routes/AdminRouter.ts` as
`POST /api/admin/job-roles`, `PUT /api/admin/job-roles/:id`, `DELETE /api/admin/job-roles/:id`,
following the same consolidation already applied to application-assessment routes in the prior
same-day retrospective. `JobRoleRouter.ts` now exposes only the two public GET routes. Their route
tests moved from `tests/routes/JobRoleRouter.test.ts` into `tests/routes/AdminRouter.test.ts`, reusing
that file's existing `createJobRole(overrides)` fixture helper instead of duplicating band/capability
setup, and the `postman/kainos-project-team7.json` collection was updated across 25 requests (17 in
"Protected Job Role Writes", 7 stale paths in "Application Assessment" left over from the previous
extraction, and 1 setup request in the applications folder) to the new `/api/admin/...` paths. No DTO,
mapper, service, or controller changes were needed — routing and its tests/docs only.

Files touched (per `git show --stat HEAD`): `postman/kainos-project-team7.json`,
`src/routes/AdminRouter.ts`, `src/routes/JobRoleRouter.ts`, `tests/routes/AdminRouter.test.ts`,
`tests/routes/JobRoleRouter.test.ts`.

## Validation results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Lint / format (`npm run ci:check`) | pass | 71 files checked, no fixes applied. |
| Typecheck (`npx tsc --noEmit`) | pass | No output. |
| Unit tests | pass | Included in the full suite run below. |
| Integration tests (Testcontainers) | pass | 43/43 in the two changed route files first, then 274/274 for the full suite. |
| Build (`npm run build`) | pass | No output. |
| Migration on fresh DB | N/A | No schema change in this slice. |
| Manual verification | not yet performed | Postman collection updated and JSON-validated; requests not yet re-run manually against a running server. |
| E2E | N/A | No E2E suite in this repository. |

## What went well

- The moved `AdminRouter.test.ts` fixtures reused the destination file's existing `createJobRole`
  helper for the new "Editable Role" / "Deletable Role" cases instead of copy-pasting the source
  file's band/capability creation, keeping one fixture pattern per file.
- After the router and test edits, the two changed route test files were run in isolation first
  (43/43) before the full suite (274/274) — cheap, fast confirmation before paying for the full
  Testcontainer suite's runtime.
- Postman edits were validated with a native `JSON.parse` immediately after the raw string edits,
  before treating the collection as done, per the house rule already recorded in
  [testing.md](../testing.md).
- After a validation run was cancelled (see below), the retry used fast/deterministic gates first
  (lint, typecheck), then confirmed Docker was running, then ran only the affected test files before
  the full suite — this produced a clean, fully green result on the very next attempt.

## What went wrong

- A single tool call chained the entire validation-gate sequence (`ci:check`, `tsc --noEmit`,
  `npm test`, `npm run build`) through a generic long-running subagent call with no interim output and
  no upfront note that the Docker-backed Testcontainers suite takes a while. The developer cancelled it
  partway through, reporting it as frozen. **Root cause:** `npm test` starts one PostgreSQL
  Testcontainer per route test file (7+ files); run as one opaque long step with no progress signal,
  this is indistinguishable from a real hang to the person watching it.
- `docs/ai/memory.md`'s endpoint table had already drifted across two earlier same-day/prior-day
  retrospectives whose proposed diffs were never applied (`GET /api/admin/applications` was missing
  entirely; `/api/job-roles/:id/applications` and its `PATCH` sibling still showed the pre-extraction
  paths). This session's job-role write move added a third, independent round of drift on top.
  **Root cause:** the repo's convention requires a developer to mark candidate lessons
  Accepted/Rejected before a diff is written, and that step had not happened for either prior
  retrospective, so nobody had revisited and applied their routine (non-judgmental) documentation
  corrections either.

## Rework and declines

No developer decline. One tool call (the chained validation-gate run) was cancelled by the developer
mid-execution and successfully redone as several smaller, faster steps immediately after.

## Time and effort signals

One pass to move the router handlers, one pass to move and reconcile the tests (including fixing a
missing `beforeEach` import caught by the type checker), two batched Postman edits plus one individual
edit across three collection folders, one cancelled validation attempt, and one successful incremental
validation attempt (fast gates → scoped tests → full suite → build) immediately after.

## Candidate lessons

| # | Lesson | Destination | Developer decision |
| - | ------ | ----------- | ------------------- |
| 1 | Do not chain the full validation-gate sequence through a single opaque long-running call when the suite includes Docker-backed Testcontainers. Run lint/typecheck first (fast), confirm Docker is up, then run only the changed test files via the dedicated test-runner tool before the full suite — this gives fast feedback and avoids a slow-but-healthy run looking like a hang. | testing.md | Pending |
| 2 | When a resource's admin-only writes move into `AdminRouter`, the resource's own router and route-test file should keep only the matching public-route tests; reconcile any moved fixtures against the destination file's existing helpers (e.g. `createJobRole(overrides)`) instead of duplicating setup. | patterns.md | Pending |
| 3 | Endpoint-table drift in `memory.md` compounds when consecutive same-day or same-week sessions touch routing and nobody resolves the previous retrospective's pending candidate lessons first. Before starting a new routing-related session, check for unresolved pending retrospectives and either resolve or explicitly re-defer them rather than layering new route changes on top of stale docs. | workflow.md | Pending |

A lesson qualifies only if it is **durable** (true next month), **actionable** (changes behaviour) and
**general** (not specific to this one story). Please mark each **Accepted** or **Rejected**.

## Proposed memory diff

The routine endpoint-table/known-gaps correction below consolidates this session's change together
with the two still-pending prior corrections (`GET /api/admin/applications` from
[2026-08-16-US051-admin-application-queue.md](2026-08-16-US051-admin-application-queue.md), and the
`/api/admin/job-roles/:id/applications` + `PATCH` path fix from
[2026-08-17-US051-admin-router-extraction.md](2026-08-17-US051-admin-router-extraction.md)), since all
three describe the same drift and this is the first time anyone has revisited it. Applied directly —
see `memory.md` and `patterns.md`. Only the three candidate lessons above remain pending your decision.

```diff
--- a/docs/ai/memory.md
+++ b/docs/ai/memory.md
@@
-| POST | `/api/job-roles` | `201` |
-| PUT | `/api/job-roles/:id` | full update, `200` / `404` |
-| DELETE | `/api/job-roles/:id` | `204` empty body / `404` |
+| POST | `/api/admin/job-roles` | ADMIN only; `201` |
+| PUT | `/api/admin/job-roles/:id` | ADMIN only; full update, `200` / `404` |
+| DELETE | `/api/admin/job-roles/:id` | ADMIN only; `204` empty body / `404` |
@@
-| GET | `/api/job-roles/:id/applications` | ADMIN only; list applications for one role |
-| PATCH | `/api/job-roles/:id/applications/:applicationId` | ADMIN only; transition `IN_PROGRESS` to `HIRED`/`REJECTED` |
+| GET | `/api/admin/applications` | ADMIN only; list every application across all job roles, newest first |
+| GET | `/api/admin/job-roles/:id/applications` | ADMIN only; list applications for one role |
+| PATCH | `/api/admin/job-roles/:id/applications/:applicationId` | ADMIN only; transition `IN_PROGRESS` to `HIRED`/`REJECTED` |
```

```diff
--- a/docs/ai/patterns.md
+++ b/docs/ai/patterns.md
@@ Router: wiring and middleware order
-router.get("/", jobRoleController.getAll);
-router.get("/:id", validateParams(idParamSchema), jobRoleController.getJobRoleById);
-router.post("/", validateBody(AddJobRoleSchema), jobRoleController.addJobRole);
-router.put(
-  "/:id",
-  validateParams(idParamSchema),
-  validateBody(updateJobRoleSchema),
-  jobRoleController.updateJobRole,
-);
-router.delete("/:id", validateParams(idParamSchema), jobRoleController.deleteJobRole);
+router.get("/", jobRoleController.getAll);
+router.get("/:id", validateParams(idParamSchema), jobRoleController.getJobRoleById);
+// ADMIN-gated writes for this resource live in AdminRouter.ts, not here — see below.
```

## Follow-ups

- [ ] The two prior retrospectives' candidate lessons
      ([2026-08-16](2026-08-16-US051-admin-application-queue.md),
      [2026-08-17 admin-router-extraction](2026-08-17-US051-admin-router-extraction.md)) are still
      Pending. This session's consolidated memory diff resolves their routine documentation
      corrections; their behavioural lessons still need an explicit decision.
- [ ] The Medium-severity empty-list assertion finding in `GET /api/admin/applications`
      (`tests/routes/AdminRouter.test.ts`), carried over from an earlier code review, is still
      unresolved.
- [ ] Manual Postman verification against a running server has not been performed yet for the moved
      `/api/admin/job-roles...` requests.
