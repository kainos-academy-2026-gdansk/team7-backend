# Repository memory — testing

What we know about testing this repository. Read before writing or changing tests.

## Setup

- Vitest, Node environment. Config lives under the `vitest` key in `package.json` — there is **no**
  `vitest.config.ts`; do not create one without approval.
- `npm test` → `vitest run`. `npm run test:coverage` → `vitest run --coverage` (v8 provider).
- Tests mirror `src/`: `tests/services/`, `tests/controllers/`, `tests/routes/`, `tests/middlewares/`,
  `tests/Dto/`, plus `tests/app.test.ts`. File name `<Module>.test.ts`.

## The three test levels

| Level | Location | Real | Mocked |
| ----- | -------- | ---- | ------ |
| Service unit | `tests/services/` | the service | Prisma |
| Controller unit | `tests/controllers/` | the controller | the service, `req`/`res`/`next` |
| Route integration | `tests/routes/` | app, router, middleware, controller, service, PostgreSQL | nothing |

## Service tests — mock Prisma by shape

```ts
const findMany = vi.fn();
const dbMock = { band: { findMany } } as unknown as PrismaClient;

beforeEach(() => {
  vi.resetAllMocks();
  bandService = new BandService(dbMock);
});
```

Assert both the returned value and the exact Prisma call arguments
(`expect(findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } })`) — that is where `select`,
`include` and `where` regressions show up.

## Controller tests — mock the service

```ts
const res = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
  send: vi.fn(),
} as unknown as Response;
const next = vi.fn();
```

Cover: success status + payload, `404` when the service returns `null`, and `next(error)` when the
service rejects. `204` responses must assert `res.send()` with no body.

## Route tests — Testcontainers

```ts
container = await new PostgreSqlContainer("postgres:16-alpine").start();
process.env.DATABASE_URL = container.getConnectionUri();
execSync("npx prisma migrate deploy", { stdio: "inherit" });
prisma = (await import("../../src/prismaClient")).default;
app = (await import("../../src/app")).default;
```

Rules learned the hard way:

- `DATABASE_URL` must be set **before** `src/prismaClient` is imported, so the imports have to be
  dynamic `await import(...)` inside `beforeAll` — a top-level `import` binds to the wrong URL.
- Use a 120s timeout on `beforeAll`; the first run pulls the image.
- Always `await prisma?.$disconnect()` and `await container?.stop()` in `afterAll`.
- Seed the data the test needs inside the test file; never rely on `prisma/seed.ts`.
- Docker must be running. Without it these tests fail — report them as *not run*, never as passing.

## House rules

- `vi.resetAllMocks()` in `beforeEach`; `vi.restoreAllMocks()` after `vi.spyOn`.
- Every endpoint change gets a test proving invalid input is rejected with `400` **before** the
  service is called (`expect(serviceMock.create).not.toHaveBeenCalled()`).
- Assert behaviour, not implementation details: status codes, response bodies, persisted rows.
- Test names read as sentences: `"returns 404 when the job role does not exist"`.
- Use `it.each([...])` for field-by-field validation cases (already used in the DTO and middleware tests).
- Never delete or `skip` a test to make the suite green. A red test is a finding for the handover.
- Do not assert version-specific Zod internals; assert `field` and `message` from `toFieldErrors`.

## Known gaps

- No E2E layer. Record E2E as **N/A** in handovers.
- No coverage threshold is enforced in CI; report coverage changes manually if they matter.
- Container startup dominates suite runtime; keep route tests focused on paths that need a real DB.

## Native and security dependencies

- When adding a native or security-sensitive dependency, verify both `npm ci` in the production image
  dependency stage and the complete image build. Record package-install success separately from later
  build failures such as certificate or ORM-engine download errors.
