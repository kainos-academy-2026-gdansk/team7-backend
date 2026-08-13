# Retrospective — US024, US040, US041 Authentication

| | |
| ---- | ---- |
| **Story** | `US024`, `US040`, `US041` — Registration, Login, and Authorisation API |
| **Date** | 2026-08-13 |
| **Branch / PR** | `authorization-login-register` / not opened |
| **Agents used** | plan-user-story / deliver-user-story |
| **Developer** | Not recorded |

## What was delivered

Added the authentication foundation and API: a Prisma `User` model with `ADMIN` and `USER` roles, Argon2 password hashing, JWT login, registration and login routes, bearer-token authentication middleware, and ADMIN-only job-role create/update/delete access. Added DTO, mapper, service, controller, middleware, unit, controller, and Testcontainer route coverage. Updated the Postman collection with 35 separate scenarios and collection variables `baseURL`, `token`, and `id`; login and job-role creation requests update the token and ID variables automatically.

## Validation results

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Lint / format (`npm run ci:check`) | pass | Biome checked 58 files. |
| Typecheck (`npx tsc --noEmit`) | pass | Strict typecheck passed. |
| Unit tests | pass | Full suite passed: 203 tests. |
| Integration tests (Testcontainers) | pass | Fresh PostgreSQL containers applied all 4 migrations, including the User migration. |
| Build (`npm run build`) | pass | TypeScript production build passed. |
| Migration on fresh DB | pass | Testcontainers applied `20260813080232_add_user_table` successfully. |
| Manual verification | approved (1 round) | Curl smoke returned registration `201` and login `200`; Postman export was JSON-validated but not manually run in the Postman UI. |
| E2E | N/A | No E2E suite exists in this repository. |

## What went well

- The migration was applied to the existing PostgreSQL database and also verified against fresh Testcontainer databases.
- The auth implementation followed the existing layered architecture and kept password hashes out of response DTOs.
- Focused auth tests found and corrected JWT metadata leaking through the request payload contract before the full suite ran.
- Existing job-role write tests were updated to use real ADMIN bearer tokens, preserving their behavior while adding explicit 401 and 403 coverage.
- The Argon2 dependency installed successfully in the Alpine Docker dependency stage without changing the Dockerfile.

## What went wrong

- The full Docker build did not complete because Prisma could not download its engine from `binaries.prisma.sh` due to the existing local issuer certificate error. **Root cause:** the build environment's certificate chain is not trusted by the Prisma download step; Argon2 installation itself succeeded.
- The repository memory still says every endpoint is public and has no authentication layer. **Root cause:** memory update is intentionally a separate human-approved workflow stage and was not silently applied.
- The development ADMIN seed password is currently a predictable literal in `prisma/seed.ts`. **Root cause:** the bootstrap account was added quickly for manual/Postman verification without introducing a documented environment variable contract. This must not be reused as a production credential.
- The Postman collection was rebuilt after the first replacement patch hit a duplicate-path editor guard. **Root cause:** the edit tool requires delete and add operations to be separate calls for the same file.

## Rework and declines

No developer decline was recorded. One focused auth middleware test initially failed because `jsonwebtoken.verify` returned standard `iat` and `exp` claims; `verifyToken` was then normalized to return only the application payload fields.

## Time and effort signals

There was one planning/question round, one focused test repair before green, full validation after implementation, and one curl smoke round. Docker was already running for Testcontainers. The Postman collection was structurally validated but not exercised through the Postman UI.

## Candidate lessons

| # | Lesson | Destination | Developer decision |
| - | ------ | ----------- | ------------------ |
| 1 | Authentication changes must be followed by a same-task repository-memory update proposal that records protected routes, token transport, and intentionally public endpoints. | `memory.md` | Accepted |
| 2 | Development bootstrap credentials must come from an explicitly documented environment variable or another non-production mechanism; never embed a reusable password literal in seed code. | `decisions.md` | Accepted |
| 3 | When a native/security dependency is introduced, validate both package installation in the production image and the complete image build, recording certificate or toolchain blockers separately. | `testing.md` | Accepted |

A lesson qualifies only if it is durable, actionable, and general. Rejected lessons should be removed rather than promoted.

## Proposed memory diff

```diff
--- a/docs/ai/memory.md
+++ b/docs/ai/memory.md
@@
 - Core entities: `JobRole` (with `status` OPEN/CLOSED, `responsibilities`), `Band`, `Capability`.
   `JobRole` belongs to one `Band` and one `Capability`. `Band.name` and `Capability.name` are unique.
+- Authentication: `POST /api/auth/register` creates a USER with an Argon2 password hash; `POST /api/auth/login`
+  returns a JWT for the `Authorization: Bearer` header. Job-role POST/PUT/DELETE currently require an ADMIN token;
+  GET routes and reference-data routes remain public by intentional partial scope.
@@
-| GET | `/api/statuses` | list, `{ statusId, statusName }` |
+| GET | `/api/statuses` | list, `{ statusId, statusName }` |
+| POST | `/api/auth/register` | `201`, defaults role to `USER` |
+| POST | `/api/auth/login` | `200` with JWT and user DTO; `401` for invalid credentials |
@@
-- No authentication or authorisation layer yet — every endpoint is public.
+- Full blanket authentication is still deferred: only job-role write endpoints are protected; GET and reference-data endpoints remain public.
```

The proposed memory, decision, and testing updates were applied after developer approval.

## Follow-ups

- [ ] Replace the literal development ADMIN password with an environment-provided bootstrap credential and document the required variable without exposing its value.
- [ ] Decide whether US041 should be expanded so all non-authentication API endpoints require a token.
- [ ] Resolve the Prisma Docker build certificate-chain issue and rerun the complete image build.
- [ ] Run the Postman collection manually against a configured development environment.
- [ ] Human review, commit, push, PR, and task-status transition remain developer actions.
