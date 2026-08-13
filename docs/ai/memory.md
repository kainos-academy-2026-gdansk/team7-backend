# Repository memory — general

Durable, team-owned facts about this repository. Read before planning any task.
Agents **propose** changes here; a developer approves them (see
[workflow.md](workflow.md) stage 7). Keep entries short, dated and factual.
No secrets, no personal data, no per-ticket noise.

## Product

- Backend REST API for an internal job-offers site: admins manage job roles, applicants browse them.
- Consumed by a separate frontend repository; this repo serves JSON only.
- Core entities: `JobRole` (with `status` OPEN/CLOSED, `responsibilities`), `Band`, `Capability`.
  `JobRole` belongs to one `Band` and one `Capability`. `Band.name` and `Capability.name` are unique.
- Authentication: `POST /api/auth/register` creates a `USER` with an Argon2 password hash;
  `POST /api/auth/login` returns a JWT for the `Authorization: Bearer` header. Job-role POST/PUT/DELETE
  require an `ADMIN` token; GET and reference-data routes remain public by intentional partial scope.

## Endpoints (current)

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/health` | `{ status: "UP", timestamp }` |
| GET | `/api/job-roles` | list, summary shape |
| GET | `/api/job-roles/:id` | detailed shape, `404` when missing |
| POST | `/api/job-roles` | `201` |
| PUT | `/api/job-roles/:id` | full update, `200` / `404` |
| DELETE | `/api/job-roles/:id` | `204` empty body / `404` |
| GET | `/api/bands` | list |
| GET | `/api/capabilities` | list |
| GET | `/api/statuses` | list, `{ statusId, statusName }` |
| POST | `/api/auth/register` | `201`, defaults role to `USER` |
| POST | `/api/auth/login` | `200` with JWT and user DTO; `401` for invalid credentials |

## Environment

- Node.js 22+, PostgreSQL 16. `.env` holds `DATABASE_URL`, `PORT`, `NODE_ENV`, and the required
  `JWT_SECRET`; it is git-ignored and must never be read into chat or logs.
- `docker compose up -d db` starts PostgreSQL 16 for local development; the API then runs with
  `npm run dev`. The `backend` compose service simulates production and is not used while developing.
- Route tests need a running Docker daemon — they start a `postgres:16-alpine` Testcontainer.
- Logs are written to `logs/error.log` and `logs/all.log` (git-ignored). Log level is `debug` outside
  production, `warn` in production.
- The `Dockerfile` handles corporate Zscaler certificates; do not remove those steps when editing it.

## Conventions worth remembering

- `src/Dto/` is capitalised (not `dto/` or `dtos/`). Filenames are PascalCase matching the export.
- Validation middleware validates but **does not** mutate `req`, so controllers still do
  `Number(req.params.id)` after `validateParams(idParamSchema)`.
- `Status` rows (`OPEN`, `CLOSED`) are owned by migration `20260812120000_job_role_status_table`.
  `prisma/seed.ts` reads them and fails loudly if they are missing — it must never create them, or
  the same status name ends up with different `statusId` values per environment.
- Services take `PrismaClient` through the constructor; wiring happens in the router file.
- There is no `vitest.config.ts`; Vitest config lives under the `vitest` key in `package.json`.

## Known gaps / follow-ups

- Full blanket authentication is still deferred: only job-role write endpoints are protected; GET and reference-data endpoints remain public.
- No E2E suite; validation stops at route-level integration tests.
- No `.env.example` in the repository.
- No pagination or filtering on `GET /api/job-roles`.

## Changelog of this file

| Date | Entry | Source |
| ---- | ----- | ------ |
| 2026-08-12 | Initial memory captured while introducing the agentic workflow. | [2026-08-12-us-020-delete-a-role.md](retrospectives/2026-08-12-us-020-delete-a-role.md) |
| 2026-08-13 | Added authentication endpoints and partial ADMIN authorization for job-role writes. | [2026-08-13-us024-us040-us041-authentication.md](retrospectives/2026-08-13-us024-us040-us041-authentication.md) |
