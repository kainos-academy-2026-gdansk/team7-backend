# Retrospective — US050-US053 Apply for a role and view my job applications

| | |
| ---- | ---- |
| **Story** | `US050-US053` — Apply for a role and view my job applications |
| **Date** | 2026-08-13 |
| **Branch / PR** | `US051/US052-application` / not opened |
| **Agents used** | plan-user-story / deliver-user-story |
| **Developer** | Not recorded |

## What was delivered

Added the applicant application API without changing the existing Prisma schema or adding dependencies. `POST /api/job-roles/:id/apply` now accepts experience, salary expectation, and skills for authenticated `USER` accounts, verifies an `OPEN` role with available positions, creates an `IN_PROGRESS` application, and rejects duplicates. `GET /api/applications` returns only the authenticated applicant's applications, including role information, submitted fields, status, timestamps, and oldest-first ordering. DTO, model, mapper, service, controller, router, app wiring, unit tests, PostgreSQL route tests, and manual Postman verification were completed. The updated Postman collection folder was not included in the dedicated branch commit. CV upload, S3 storage, and all admin application assessment behavior are outside this delivery scope.

## Validation results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Lint / format (`npm run ci:check`) | pass | Biome checked 68 files after formatting and import-order fixes. |
| Typecheck (`npx tsc --noEmit`) | pass | Strict TypeScript check passed. |
| Unit tests | pass | Focused unit checks passed: 33 tests; full suite passed with 249 tests. |
| Integration tests (Testcontainers) | pass | Application route suite passed with 13 tests; full suite passed with 24 test files. |
| Build (`npm run build`) | pass | Production TypeScript build passed. |
| Migration on fresh DB | N/A | No schema or migration changes in this story; existing migration chain was exercised by route tests. |
| Manual verification | approved (1 round) | The developer manually verified the application creation and applicant application-listing flows using the Postman collection. |
| E2E | N/A | No E2E suite exists in this repository. |

## What went well

- Planning resolved the important contract ambiguity before implementation: the existing database fields are used, CV/S3 work is excluded, only `USER` accounts may use the endpoints, and application lists are oldest first.
- The implementation stayed within the established layered architecture and reused the existing authentication, validation, shared status lookup, and Testcontainer conventions.
- The service uses status names rather than environment-dependent numeric IDs and translates both pre-existing and concurrent duplicate applications into `409` responses.
- Route tests exercised the real migration chain and database behavior, including user isolation, role eligibility, duplicate protection, and persisted `IN_PROGRESS` status.
- Manual Postman verification covered the main success and failure paths, including dynamic test users, role eligibility, duplicate protection, authorization, user isolation, and oldest-first listing.

## What went wrong

- The first focused service tests failed because the parameterized role fixtures used a flat `statusName` property while the Prisma select shape is nested under `status`. **Root cause:** the test fixture was written from the conceptual data shape rather than the exact mocked Prisma response shape.
- The first route integration run failed in setup because status IDs were interpolated into `it.each` data before `beforeAll` initialized them. **Root cause:** test cases were evaluated at module definition time, while their database-derived values only exist during suite setup.
- The first lint gate failed on formatting and import organization in newly created files. **Root cause:** the initial edits were applied before running the repository formatter.
- The controller test initially used a direct partial-object-to-Express-`Request` cast, which TypeScript rejected. **Root cause:** the mock did not contain the full Express request surface; the repository's partial-request convention was not applied to this new fixture.
- The first Postman collection edit produced malformed JSON in several long one-line request objects. **Root cause:** a large hand-authored JSON patch repeated a URL host typo, and structural parsing was run only after the edit rather than before handing it over.

## Rework and declines

There were no implementation declines. Planning required clarification of the request fields, CV/S3 scope, authentication roles, conflict status codes, response fields, and ordering before approval. During delivery, the service test fixtures, route test setup, formatting, controller request cast, and Postman JSON were corrected locally and revalidated. The developer then manually verified the applicant flows; admin application assessment was explicitly excluded from this story.

## Time and effort signals

There was one planning handoff with multiple clarification rounds, followed by one implementation pass. Focused validation initially had three service-test failures and then passed after one fixture correction. The route suite initially had three setup failures and then passed after one test-definition correction. The first lint gate required one formatting/import correction pass. The Postman collection required two JSON repair passes before `jq` validation passed. One manual verification round was completed successfully. No database migration or dependency work was required.

## Candidate lessons

| # | Lesson | Destination | Developer decision |
| - | ------ | ----------- | ------------------ |
| 1 | When mocking Prisma relations, copy the exact nested shape produced by the service's `select`/`include` query and keep a nearby fixture example for each relation. | `testing.md` | Accepted |
| 2 | Test cases that depend on database-derived IDs must resolve those values inside the test body or a runtime setup helper, not in top-level parameterized data. | `testing.md` | Accepted |
| 3 | Validate structured artifacts such as Postman collections with their native parser immediately after every mechanical edit. | `testing.md` | Accepted |

A lesson qualifies only if it is durable, actionable, and general. All three lessons were accepted and applied to `docs/ai/testing.md`.

## Proposed memory diff

```diff
--- a/docs/ai/memory.md
+++ b/docs/ai/memory.md
@@
 - No pagination or filtering on `GET /api/job-roles`.
+- Application API: `POST /api/job-roles/:id/apply` and `GET /api/applications` are available to
+  authenticated `USER` accounts; applications require experience, salary expectation, and skills, start
+  as `IN_PROGRESS`, reject unavailable/duplicate submissions with `409`, and list the applicant's own
+  applications oldest first. CV/S3 storage remains deferred.
```

The developer approved the application fact and the three testing lessons. The memory and testing updates have been applied.

```diff
--- a/docs/ai/testing.md
+++ b/docs/ai/testing.md
@@
 - Use `it.each([...])` for field-by-field validation cases (already used in the DTO and middleware tests).
+- When mocking Prisma relations, match the exact nested shape produced by the service's `select` or
+  `include` query, for example `status: { statusName: "OPEN" }` rather than a flat `statusName` field.
+- Resolve database-derived IDs inside test bodies or runtime setup helpers; do not capture values from
+  `beforeAll` in top-level `it.each` data because the cases are evaluated before setup runs.
 - Never delete or `skip` a test to make the suite green. A red test is a finding for the handover.
+- Validate structured manual-test artifacts such as Postman collections with a native JSON validator
+  immediately after edits and before manual API verification.
```

## Follow-ups

- [ ] Define a separate approved CV/S3 story if CV upload becomes required.
- [ ] Human review, commit, push, PR, and task-status transition remain developer actions.
