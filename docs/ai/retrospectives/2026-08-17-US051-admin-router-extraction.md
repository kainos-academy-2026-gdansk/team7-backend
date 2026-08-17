# Retrospective — US051 (follow-up) Extract admin application routes into AdminRouter

| | |
| ---- | ---- |
| **Story** | `US051` — Assess role applications (follow-up: dedicated `AdminRouter`) |
| **Date** | 2026-08-17 |
| **Branch / PR** | `view-aplications-hotfix` / not opened |
| **Agents used** | None formally invoked — conversational review and fix-forward in the same session; `plan-user-story` / `deliver-user-story` were not used |
| **Developer** | Not recorded |

## What was delivered

The developer manually extracted all ADMIN-only application routes (list all, list by role, update
status) out of `src/routes/ApplicationRouter.ts` into a new `src/routes/AdminRouter.ts`, mounted at
`/api/admin` in `app.ts`, leaving `ApplicationRouter.ts` with only the two USER-facing routes (apply,
list own applications). Reviewing the refactor found that both path-param routes used mismatched
segment names (`:jobRRoleId`, `:jobRoleId`) that didn't match the shared `idParamSchema` /
`applicationParamsSchema` (both keyed on `id`) or the controller's `req.params.id` reads — every call
to either route would 400 before reaching the controller. After checking how many routers actually
share `idParamSchema` (three: `AdminRouter`, `ApplicationRouter`, `JobRoleRouter`) versus
`applicationParamsSchema` (only the one PATCH route), the fix kept the generic `:id` param — avoiding
any change to a schema shared elsewhere — and added a static `job-roles` path segment for readability
instead. Final routes: `GET /api/admin/applications`, `GET /api/admin/job-roles/:id/applications`,
`PATCH /api/admin/job-roles/:id/applications/:applicationId` (the last two restore the resource shape
that existed before the extraction, now correctly nested under `/api/admin`). The three admin route
tests (plus their shared `createApplicationForAssessment` helper) were moved out of
`tests/routes/ApplicationRouter.test.ts` into a new, self-contained `tests/routes/AdminRouter.test.ts`
(own Testcontainer, matching the existing one-container-per-route-file convention), with paths updated
to match. No DTO, mapper, service, or controller changes were needed — only routing and its tests.

Files touched: `src/app.ts`, `src/routes/ApplicationRouter.ts`, `src/routes/AdminRouter.ts` (new),
`tests/routes/ApplicationRouter.test.ts`, `tests/routes/AdminRouter.test.ts` (new).

## Validation results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Lint / format (`npm run ci:check`) | pass | 71 files checked, no fixes applied. |
| Typecheck (`npx tsc --noEmit`) | pass | No output. |
| Unit tests | pass | Included in the full suite run below. |
| Integration tests (Testcontainers) | pass | 274 tests across 25 files (was 274 / 24 before the split — same total, confirming no test was lost or duplicated). |
| Build (`npm run build`) | pass | No output. |
| Migration on fresh DB | N/A | No schema change in this slice. |
| Manual verification | approved, informally | No written handover document was produced; the developer reviewed and signed off on each step conversationally (approved the param-name fix, chose the `job-roles` path-segment approach, requested the test split). |
| E2E | N/A | No E2E suite in this repository. |

## What went well

- The review didn't stop at "does it compile" — checking the actual path param names against the
  shared schemas' keys and the controller's `req.params` reads caught a defect that `tsc` cannot see
  (Express route params are untyped strings at compile time), before it reached a handover.
- Before proposing a rename, the actual blast radius was checked with a grep across the codebase
  rather than assumed — this showed `idParamSchema` is reused by three routers while
  `applicationParamsSchema` is private to one, and that fact directly drove the recommendation to keep
  `:id` rather than rename it.
- The agreed fix (generic `:id` plus a static `job-roles` segment) satisfied the developer's semantic
  concern without touching any shared schema or rippling into `JobRoleRouter` / `ApplicationRouter`.
- The test split followed the existing convention exactly (one Testcontainer per route test file, no
  new shared setup helper invented), so `AdminRouter.test.ts` looks like every other file in
  `tests/routes/`.
- All four validation gates were re-run after each structural change (the router fix, then the test
  split) rather than only once at the end, and stayed green throughout.

## What went wrong

- This work entered as a developer-driven manual refactor plus an ad hoc "review this" request, not as
  a story intake. **Root cause:** because of that entry point, the Planning stage (written plan, Needs
  approval list) and a written Dev Handover with an explicit Approve/Decline were both skipped — the
  developer approved each step conversationally instead. Reasonable for a same-day reorganization of
  already-shipped, already-tested behaviour, but worth naming rather than quietly treating as
  equivalent to a full handover.
- The param-name bug itself is exactly what a written plan's file-list/test-plan review is meant to
  catch before code is written. **Root cause:** refactor-then-review ordering instead of plan-then-
  implement, a direct consequence of the point above.
- `docs/ai/memory.md`'s endpoint table was already stale going into this session — it never received
  the `GET /api/admin/applications` row proposed in the previous retrospective, because that
  retrospective's candidate lessons were never marked Accepted/Rejected. This session's path changes
  (`/api/job-roles/:id/applications` → `/api/admin/job-roles/:id/applications`) make it stale in a
  second, independent way. **Root cause:** memory updates depend on a prior retrospective's lessons
  being resolved, and that step stalled.
- The Medium-severity test finding from the last code review (the empty-list assertion in
  `GET /api/admin/applications` that doesn't actually verify emptiness against the shared Testcontainer
  database) was carried over unchanged into the new `AdminRouter.test.ts`. It was flagged again but the
  developer moved to this retrospective before deciding whether to fix it now.

## Rework and declines

No developer decline. One mid-flight refinement: the initial fix (revert both path params to `:id`,
matching the shared schemas exactly) was already correct, but the developer asked for better semantics,
which led to adding the static `job-roles` path segment. That is a refinement of a correct fix, not a
correction of a mistake.

## Time and effort signals

One review pass surfaced the param-name bug immediately. One design discussion (generic `:id` vs.
`jobRoleId`, resolved by checking schema consumers) before settling on the path-segment approach. Two
implementation passes: the router param fix, then the test relocation. Validation gates were run in
full after each pass and stayed green both times — zero red gates during this slice.

## Candidate lessons

| # | Lesson | Destination | Developer decision |
| - | ------ | ----------- | ------------------ |
| 1 | A route's path param name must match the shared validation schema's key (e.g. `idParamSchema`'s `id`) and what the controller reads from `req.params`. This mismatch passes `tsc` cleanly but makes the route 400 on every call — check it explicitly whenever a route is added, moved, or its param is renamed. | patterns.md | Pending |
| 2 | Before renaming or restructuring a field on a schema/type, grep all of its consumers first. A schema used by one route is a cheap, contained rename; a schema shared across multiple routers (like `idParamSchema`, reused by three routers in this codebase) ripples into unrelated files and needs explicit approval before it is touched. | patterns.md | Pending |

A lesson qualifies only if it is **durable** (true next month), **actionable** (changes behaviour) and
**general** (not specific to this one story). Please mark each **Accepted** or **Rejected**.

## Proposed memory diff

```diff
--- a/docs/ai/memory.md
+++ b/docs/ai/memory.md
@@
 | POST | `/api/job-roles/:id/apply` | `USER`-only; `201` creates an `IN_PROGRESS` application; `409` for unavailable or duplicate applications |
 | GET | `/api/applications` | `USER`-only; `200` returns the authenticated applicant's applications oldest first |
-| GET | `/api/job-roles/:id/applications` | ADMIN only; list applications for one role |
-| PATCH | `/api/job-roles/:id/applications/:applicationId` | ADMIN only; transition `IN_PROGRESS` to `HIRED`/`REJECTED` |
+| GET | `/api/admin/applications` | ADMIN only; list every application across all job roles, newest first |
+| GET | `/api/admin/job-roles/:id/applications` | ADMIN only; list applications for one role |
+| PATCH | `/api/admin/job-roles/:id/applications/:applicationId` | ADMIN only; transition `IN_PROGRESS` to `HIRED`/`REJECTED` |
@@
 ## Known gaps / follow-ups

+- All ADMIN application routes now live in `src/routes/AdminRouter.ts`, mounted once at `/api/admin` —
+  no longer affected by `ApplicationRouter`'s double mount (below).
+- `ApplicationRouter` (USER-only: apply, list own applications) is still mounted at both `/api` and
+  `/api/job-roles` in `app.ts`, so those two routes remain reachable under either prefix.
```

```diff
--- a/docs/ai/patterns.md
+++ b/docs/ai/patterns.md
@@ Shared id param schema
 Reuse it. Do not create per-route id schemas.

+Before renaming its `id` key or forking a variant, grep every router that imports it — it is reused
+across multiple routers, so a rename ripples further than the file you're editing.
+
 ## Validation middleware contract
```

```diff
--- a/docs/ai/patterns.md
+++ b/docs/ai/patterns.md
@@ ## Anti-patterns

+- A route path param whose name doesn't match the shared schema's key or the controller's
+  `req.params` read (e.g. `:jobRoleId` validated by `idParamSchema`, which expects `id`) — this is
+  invisible to `tsc` and makes the route 400 on every call.
 - Prisma imported or called inside a controller.
```

The diff above is a preview. Only the rows/paragraphs tied to lessons marked **Accepted** will actually
be written, alongside the routine endpoint-table correction, once you confirm.

## Follow-ups

- [ ] The previous retrospective's three candidate lessons
      ([2026-08-16-US051-admin-application-queue.md](2026-08-16-US051-admin-application-queue.md)) are
      still marked Pending — worth resolving together with this one so `docs/ai/memory.md` stops
      drifting further behind the actual routes.
- [ ] Decide whether to fix the Medium-severity empty-list assertion in
      `GET /api/admin/applications` (`tests/routes/AdminRouter.test.ts`), carried over from the last
      code review, or track it separately.
- [ ] Consider updating the Postman collection (`postman/`) for the new `/api/admin/job-roles/:id/...`
      paths if it references the old `/api/job-roles/:id/applications` shape.
