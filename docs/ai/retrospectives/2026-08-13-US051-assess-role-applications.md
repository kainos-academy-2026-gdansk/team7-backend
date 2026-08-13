# Retrospective — US051 Assess Role Applications

| | |
| ---- | ---- |
| **Story** | `US051` — Assess role applications |
| **Date** | 2026-08-13 |
| **Branch / PR** | `US051-asses-role-applications` / not opened |
| **Agents used** | planning and delivery in chat |
| **Developer** | Not recorded |

## What was delivered

Delivered the backend assessment workflow as one slice: ADMIN users can list applications for a job role and update an in-progress application to `HIRED` or `REJECTED`. Hiring runs in a Prisma transaction, decrements the role's open-position count, and rejects the update when no position is available; rejecting leaves the count unchanged. Repeated or opposite transitions return `409`. The delivery includes response DTOs/mapping, parameter and body validation, a typed conflict error, unit and Testcontainer integration coverage, idempotent seeded demo applicants/applications, and Postman requests for list, hire, reject, conflict, validation, and authorization paths. CV/S3, notifications, applicant submission, and frontend confirmation remain out of scope.

## Validation results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Lint / format (`npm run ci:check`) | pass | 68 files checked with no fixes. |
| Typecheck (`npx tsc --noEmit`) | pass | Strict TypeScript check passed. |
| Unit tests | pass | Full suite passed: 241 tests across 23 files. |
| Integration tests (Testcontainers) | pass | Application list and mutation routes ran against fresh PostgreSQL migrations. |
| Build (`npm run build`) | pass | Production TypeScript build passed. |
| Migration on fresh DB | pass | Existing application migrations applied in Testcontainers; no schema change was needed for this API slice. |
| Seed and Postman export | pass | `npx prisma db seed` succeeded; Postman JSON parsed with the assessment folder and variables. |
| Manual verification | not run | Postman requests were prepared but not manually executed in the UI during this loop. |
| E2E | N/A | No E2E suite exists in this repository. |

## What went well

- The existing Application schema and shared status table supported the API work without another migration.
- The transactional mutation prevents application-status and position-count updates from committing independently.
- Conditional updates make a repeated transition and a hire with zero/null positions fail predictably with `409`.
- The application list response intentionally selects applicant email and status name only, avoiding `passwordHash` exposure.
- Seed data and Postman requests make the entire ADMIN assessment workflow repeatable after `npx prisma db seed`.

## What went wrong

- The first planned implementation covered only the GET list because the hire/reject work was accidentally cancelled. **Root cause:** scope was clarified incrementally rather than confirmed as the full US051 workflow at the outset. The mutation plan and implementation were completed in the same delivery loop after correction.
- A pass-through `ConflictError` constructor failed Biome's `noUselessConstructor` rule. **Root cause:** the initial error type copied a common class pattern without checking the repository's lint rules. Removing the constructor resolved the failure.
- The shared `Status` table still cannot enforce domain-specific states at the FK level. **Root cause:** the deliberate shared lookup-table decision; service-level status-name validation is required on mutations.

## Rework and declines

No developer decline was recorded. The GET-only assessment list was extended in the same loop to include the intended HIRE/REJECT workflow, conflict semantics, seed data, and Postman requests.

## Time and effort signals

There were two planning refinements: first narrowing the GET list, then restoring the mutation acceptance criteria. One focused lint repair was needed. Focused mutation tests passed (56 tests), then the full suite passed (241 tests).

## Candidate lessons

| # | Lesson | Destination | Developer decision |
| - | ------ | ----------- | ------------------ |
| 1 | State transitions that mutate related records must use one transaction and conditional updates, with conflicts returned when the prior state no longer permits the transition. | `decisions.md` | Accepted |
| 2 | Seed data used by a Postman workflow should be idempotent and reset the scenario's state so documented requests can be rerun. | `testing.md` | Accepted |

## Proposed memory diff

```diff
--- a/docs/ai/memory.md
+++ b/docs/ai/memory.md
@@
 | POST | `/api/auth/login` | `200` with JWT and user DTO; `401` for invalid credentials |
+| GET | `/api/job-roles/:id/applications` | ADMIN only; list applications for one role |
+| PATCH | `/api/job-roles/:id/applications/:applicationId` | ADMIN only; transition IN_PROGRESS to HIRED/REJECTED |
@@
 - Application statuses are `IN_PROGRESS`, `HIRED`, and `REJECTED`; JobRole statuses remain `OPEN` and
   `CLOSED`. The shared table requires service-level status-domain validation.
+- Hiring is transactional: it requires an IN_PROGRESS application and an open position, then changes
+  the application to HIRED and decrements positions. Rejection leaves positions unchanged; invalid
+  transitions and unavailable positions return 409.
```

The memory and decision/testing updates were applied as part of this combined US051 loop.

## Follow-ups

- [ ] Implement US050 applicant application submission and initial `IN_PROGRESS` creation.
- [ ] Add CV/S3 storage and safe CV retrieval when the storage blocker is resolved.
- [ ] Add post-commit notification delivery for hire/reject (US057).
- [ ] Implement US053 applicant application history.
- [ ] Implement US055 automatic JobRole status updates when positions reach zero.
- [ ] Human review, commit, push, PR, and task-status transition remain developer actions.
