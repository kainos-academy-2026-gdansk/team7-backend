# AGENTS.md

## Goal

Build a complete educational REST backend called **Office Plant API** using:

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- Morgan
- Winston
- Vitest
- Supertest

Follow the structure and coding style of the supplied Kainos project notes, especially the separation into controller/service/router/DTO/mapper/validators, the Zod middleware style, `app.ts` vs `index.ts`, Prisma singleton, and test organization.

When this file explicitly differs from the notes, this file wins.

Keep the project simple. Do not introduce Clean Architecture, DDD, CQRS, repositories, DI containers, factories, ports/adapters, use cases, or a separate domain entity.

---

## 1. Working directory

Create and work only inside:

```text
D:\programowanie\codex\agentic\office-plant-api
```

If needed:

```bash
npm init -y
```

Do not modify files outside this directory.

Implement the whole project autonomously, install dependencies, configure Prisma/PostgreSQL, write tests, run them, and fix failures.

---

## 2. Domain

Use exactly one main application entity:

```text
Plant
```

Fields:

```text
id: number
name: string
species: string
room: string
wateringIntervalDays: number
isAlive: boolean
createdAt: Date
updatedAt: Date
```

Do not add other entities or relations.

---

## 3. CRUD

Implement:

```text
GET    /api/plants
GET    /api/plants/:id
POST   /api/plants
PUT    /api/plants/:id
DELETE /api/plants/:id
```

Use `PUT`, not `PATCH`.

`PUT` is a full update and uses the same editable request shape as create.

Expected statuses:

```text
GET collection       200
GET existing         200
GET missing          404
POST valid           201
POST invalid         400
PUT valid            200
PUT invalid          400
PUT missing          404
DELETE existing      204
DELETE missing       404
invalid URL id       400
unknown route        404
unexpected error     500
```

`DELETE 204` must have no response body.

No soft delete.

---

## 4. Required structure

Use this structure closely:

```text
office-plant-api/
├── generated/
│   └── prisma/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── controllers/
│   │   └── plantController.ts
│   ├── dtos/
│   │   └── plantDto.ts
│   ├── mappers/
│   │   └── plantMapper.ts
│   ├── routes/
│   │   └── plantRouter.ts
│   ├── services/
│   │   └── plantService.ts
│   ├── validators/
│   │   └── validationMiddleware.ts
│   ├── app.ts
│   ├── db.ts
│   ├── errorHandler.ts
│   ├── logger.ts
│   └── index.ts
├── tests/
│   ├── controllers/
│   │   └── plantController.test.ts
│   ├── routes/
│   │   └── plantRouter.test.ts
│   └── services/
│       └── plantService.test.ts
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── AGENTS.md
```

Important conventions from the Kainos notes:

- use `dtos/`, not `dto/`
- use `validators/validationMiddleware.ts`
- use `mappers/`
- tests are grouped by `controllers`, `routes`, `services`
- use filenames such as `plantController.ts`, not kebab-case variants
- `app.ts` configures Express
- `index.ts` starts the server
- `db.ts` owns the Prisma singleton

`logger.ts` and `errorHandler.ts` are required additions for this task.

---

## 5. PostgreSQL and Prisma

Use PostgreSQL, not SQLite.

`prisma/schema.prisma` should define one model:

```prisma
model Plant {
  id                   Int      @id @default(autoincrement())
  name                 String
  species              String
  room                 String
  wateringIntervalDays Int
  isAlive              Boolean
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

Datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Generate Prisma Client into:

```text
generated/prisma
```

Use generator syntax supported by the installed Prisma version while preserving that output location.

Conceptually it should be equivalent to:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}
```

Do not pin an obsolete Prisma version only to preserve old syntax.

---

## 6. PostgreSQL via Docker CLI

Use Docker CLI, not Docker Compose and not a Dockerfile.

Use/reuse a container named:

```text
office-plant-postgres
```

Equivalent Windows-friendly command:

```powershell
docker run --name office-plant-postgres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=sekretnehaslo -e POSTGRES_DB=office_plant_db -p 5432:5432 -d postgres:15
```

Before creating it, check whether it already exists. If it exists but is stopped, start it.

Do not delete unrelated containers.

Use:

```env
DATABASE_URL="postgresql://admin:sekretnehaslo@localhost:5432/office_plant_db?schema=public"
```

Initialize/migrate/generate as needed:

```bash
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

Use the Prisma-version-correct seed configuration.

---

## 7. Prisma singleton: `src/db.ts`

Create one shared Prisma Client for the running application.

Conceptually:

```ts
import { PrismaClient } from "../generated/prisma";

export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
  errorFormat: "pretty",
});
```

Adapt imports/options only if required by the installed Prisma version.

Do not create Prisma Client inside controllers, services, routers per request, middleware, or `app.ts`.

A separate Prisma Client in `prisma/seed.ts` is allowed because the seed script is a separate process. Disconnect it in `finally`.

---

## 8. Dependency construction

No DI container and no factories.

Dependencies must be composed explicitly in `src/routes/plantRouter.ts`:

```ts
const plantService = new PlantService(prisma);
const plantController = new PlantController(plantService);
```

`PlantService` must receive Prisma in its constructor.

This is an intentional project-specific difference from examples where the service imports `db.ts` directly.

Do not change it to hidden global access inside the service.

---

## 9. DTOs and schemas: `src/dtos/plantDto.ts`

Keep request schemas, request DTO type, ID schema, and response DTO together in this file.

Use these exact exported names:

```text
CreatePlantRequestSchema
CreatePlantRequestDTO
IdParamSchema
PlantResponseDTO
```

### Create schema

Use Zod as the source of truth:

```ts
import { z } from "zod";

export const CreatePlantRequestSchema = z.object({
  name: z.string().min(2, "Minimum 2 znaki w nazwie"),
  species: z.string().min(2, "Minimum 2 znaki w gatunku"),
  room: z.string().min(1, "Pomieszczenie jest wymagane"),
  wateringIntervalDays: z
    .number()
    .int()
    .positive("Interwał podlewania musi być dodatnią liczbą całkowitą"),
  isAlive: z.boolean(),
});
```

Using `.strict()` is preferred.

Infer the request DTO:

```ts
export type CreatePlantRequestDTO =
  z.infer<typeof CreatePlantRequestSchema>;
```

Do not duplicate this shape in an interface.

Use `CreatePlantRequestDTO` for both POST and PUT.

Do not create `UpdatePlantRequestDTO`.

### ID schema

```ts
export const IdParamSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive("ID musi być dodatnią liczbą całkowitą"),
});
```

`z.coerce.number()` is intentional because Express params arrive as strings.

### Response DTO

Create a separate response contract:

```ts
export interface PlantResponseDTO {
  id: number;
  name: string;
  species: string;
  room: string;
  wateringIntervalDays: number;
  isAlive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 10. Mapper: `src/mappers/plantMapper.ts`

Use a mapper class with a static method, following the Kainos notes.

Conceptually:

```ts
import type { Plant } from "../../generated/prisma";
import type { PlantResponseDTO } from "../dtos/plantDto";

export class PlantMapper {
  static mapToResponseDto(plant: Plant): PlantResponseDTO {
    return {
      id: plant.id,
      name: plant.name,
      species: plant.species,
      room: plant.room,
      wateringIntervalDays: plant.wateringIntervalDays,
      isAlive: plant.isAlive,
      createdAt: plant.createdAt.toISOString(),
      updatedAt: plant.updatedAt.toISOString(),
    };
  }
}
```

The mapper transforms:

```text
Prisma Plant -> PlantResponseDTO
```

Do not create a separate domain object between them.

---

## 11. Validation middleware

Create exactly:

```text
src/validators/validationMiddleware.ts
```

It exports two separate higher-order middleware functions:

```text
validateBody
validateParams
```

They stay in one file.

Do not create separate `validate-id.middleware.ts` and `validate-body.middleware.ts` files.

### `validateBody`

Follow this style closely:

```ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Błąd walidacji danych",
          issues: error.issues,
        });
        return;
      }

      next(error);
    }
  };
};
```

Requirements:

- use `schema.parse`
- replace `req.body` with parsed data
- Zod errors return 400 before the controller
- return native `error.issues`
- do not manually translate individual Zod issues
- non-Zod failures go to the shared error handler through `next(error)`

### `validateParams`

Follow this style:

```ts
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Błąd walidacji parametrów URL",
          issues: error.issues,
        });
        return;
      }

      next(error);
    }
  };
};
```

The localized `as any` is allowed here because Zod changes the Express param `id` from string to number.

Avoid broad `any` elsewhere.

Validation error JSON must use top-level fields:

```json
{
  "message": "Błąd walidacji danych",
  "issues": []
}
```

or:

```json
{
  "message": "Błąd walidacji parametrów URL",
  "issues": []
}
```

Do not wrap these inside an `error` property.

---

## 12. Service: `src/services/plantService.ts`

`PlantService` must be a class.

It is independent from Express and never uses `req`, `res`, or `next`.

Constructor:

```ts
constructor(private prisma: PrismaClient) {}
```

Implement:

```text
getAll()
getById(id)
create(data)
update(id, data)
delete(id)
```

Use Prisma directly. No repository.

Expected shape:

```ts
async getAll(): Promise<PlantResponseDTO[]> {
  const result = await this.prisma.plant.findMany();

  return result.map((plant) =>
    PlantMapper.mapToResponseDto(plant)
  );
}
```

`getById` returns `PlantResponseDTO | null`.

`create` accepts `CreatePlantRequestDTO`.

`update` accepts:

```text
id: number
data: CreatePlantRequestDTO
```

and performs a full update.

`delete` returns `Promise<void>`.

Map outgoing Prisma records through `PlantMapper`.

---

## 13. Controller: `src/controllers/plantController.ts`

`PlantController` must be a class:

```ts
export class PlantController {
  constructor(private service: PlantService) {}
}
```

Use arrow-function handler properties:

```ts
getAll = async (...) => {};
getById = async (...) => {};
create = async (...) => {};
update = async (...) => {};
delete = async (...) => {};
```

The controller handles HTTP only. It never calls Prisma.

Because `validateParams(IdParamSchema)` has already converted the ID, use the Kainos-style cast:

```ts
const id = req.params.id as unknown as number;
```

Do not parse the ID again in each controller.

Behavior:

```text
getAll     -> service.getAll() -> 200 JSON
getById    -> null => 404, otherwise 200 JSON
create     -> validated req.body -> 201 JSON
update     -> validated id + body -> 200 JSON
delete     -> validated id -> 204 send()
```

Example 404:

```json
{
  "message": "Nie znaleziono rośliny o podanym ID"
}
```

Use a shared error handler instead of repeating local 500 responses.

Controller methods should catch unexpected errors and call:

```ts
next(error);
```

---

## 14. Shared error handler

Create:

```text
src/errorHandler.ts
```

Use standard Express error-middleware arguments.

Responsibilities:

- log unexpected errors through Winston
- return 404 for Prisma's known missing-record error during update/delete, using the version-appropriate Prisma known-request error/code
- return 500 for unknown errors
- never expose stack traces to HTTP clients

Default unexpected response:

```json
{
  "message": "Wewnętrzny błąd serwera"
}
```

Keep the handler small.

Do not create a large custom error hierarchy.

---

## 15. Router: `src/routes/plantRouter.ts`

Import the singleton Prisma Client and construct dependencies here:

```ts
const router = Router();

const plantService = new PlantService(prisma);
const plantController = new PlantController(plantService);
```

Register:

```ts
router.get(
  "/",
  plantController.getAll
);

router.get(
  "/:id",
  validateParams(IdParamSchema),
  plantController.getById
);

router.post(
  "/",
  validateBody(CreatePlantRequestSchema),
  plantController.create
);

router.put(
  "/:id",
  validateParams(IdParamSchema),
  validateBody(CreatePlantRequestSchema),
  plantController.update
);

router.delete(
  "/:id",
  validateParams(IdParamSchema),
  plantController.delete
);

export default router;
```

No factories.

---

## 16. Logging

Create:

```text
src/logger.ts
```

Configure Winston with at least:

```text
timestamp
console transport
info/http/warn/error levels
```

Use Winston for application logs.

Install and configure Morgan for HTTP requests.

Morgan should write into Winston, for example:

```ts
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  })
);
```

Do not maintain unrelated Morgan and Winston console outputs.

Avoid random `console.log()` in application code.

---

## 17. `app.ts`

`src/app.ts` configures Express and exports the app.

It must contain the equivalent of:

```text
express()
express.json()
Morgan
/api/plants router
unknown-route 404
global error handler
```

Conceptually:

```ts
const app = express();

app.use(express.json());
app.use(morgan(...));

app.use("/api/plants", plantRouter);

app.use((req, res) => {
  res.status(404).json({
    message: "Nie znaleziono endpointu",
  });
});

app.use(errorHandler);

export default app;
```

Do not call `app.listen()` in `app.ts`.

---

## 18. `index.ts`

`src/index.ts` is the entry point and starts the server.

Use `process.env.PORT` with fallback `3000`.

Log startup through Winston.

Implement simple graceful shutdown for `SIGINT` and `SIGTERM`:

- close HTTP server
- call `prisma.$disconnect()`
- log shutdown

Do not build an elaborate lifecycle framework.

---

## 19. Seed

Create:

```text
prisma/seed.ts
```

Use a separate Prisma Client.

Before inserting:

```ts
await prisma.plant.deleteMany();
```

Seed several valid plants, e.g.:

```text
Stefan
Barbara
Geralt z Parapetu
```

Disconnect in `finally`.

---

## 20. Dependencies

Runtime dependencies must include:

```text
express
@prisma/client
zod
morgan
winston
```

Development dependencies must include what is needed for:

```text
typescript
tsx
prisma
vitest
supertest
@types/node
@types/express
@types/morgan
@types/supertest
```

Do not install NestJS, TypeORM, Sequelize, Inversify, tsyringe, or repository/DI libraries.

---

## 21. Scripts

Provide working equivalents of:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "<run compiled index.js>",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:controllers": "vitest run tests/controllers",
    "test:services": "vitest run tests/services",
    "test:routes": "vitest run tests/routes",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed"
  }
}
```

The exact compiled `start` path must match the final TypeScript output.

`dev` must use:

```text
tsx watch src/index.ts
```

---

## 22. TypeScript

Enable strict mode.

Do not disable type checking to make the project compile.

Avoid unnecessary `any`.

Allowed exceptions:

- the localized `req.params = ... as any` in validation middleware
- small test-only casts when mocking Express/Prisma would otherwise require excessive ceremony

---

## 23. Service unit tests

Create:

```text
tests/services/plantService.test.ts
```

Use Vitest.

Do not use the real database.

Mock a Prisma-shaped dependency and inject it:

```ts
const service = new PlantService(mockPrisma);
```

This is the project-specific equivalent of mocking `db.ts` in the supplied notes.

Do not add a repository interface just for testing.

Test at least:

```text
getAll
getById
create
update
delete
```

Verify:

- correct Prisma method calls
- correct `where`/`data`
- mapper output
- `getById` returns null when Prisma returns null
- delete resolves correctly

Prefer Arrange / Act / Assert.

---

## 24. Controller unit tests

Create:

```text
tests/controllers/plantController.test.ts
```

Do not start Express and do not use a database.

Mock `PlantService`.

Use:

```text
Partial<Request>
Partial<Response>
NextFunction mock
```

Response mock should support:

```ts
status: vi.fn().mockReturnThis(),
json: vi.fn(),
send: vi.fn(),
```

Test important CRUD behavior:

- service receives body
- numeric ID is forwarded
- GET success -> 200
- GET missing -> 404
- POST -> 201
- PUT -> 200
- DELETE -> 204
- service exception -> forwarded to `next(error)`

Because this project has a global error handler, do not expect each controller to build its own 500 response.

---

## 25. Route integration tests

Create:

```text
tests/routes/plantRouter.test.ts
```

Use:

```text
Supertest
Vitest
```

Import:

```ts
import app from "../../src/app";
```

Use:

```ts
request(app)
```

Do not start a real network port.

Follow the Kainos route-test approach:

```text
real Express
real router
real Zod middleware
real controller
mocked/spied service
no real PostgreSQL
```

The route tests cover:

```text
HTTP -> Express -> Router -> Validators -> Controller -> mocked Service
```

Do not replace them with database integration tests.

Use `vi.spyOn(PlantService.prototype, "...")` or an equivalent clean module mock.

Reset/restore mocks between tests.

---

## 26. Required route tests

Cover at least:

### GET collection

```text
GET /api/plants -> 200
```

### GET valid ID

```text
GET /api/plants/1 -> 200
```

Verify service receives numeric `1`, not string `"1"`.

### GET invalid ID

```text
GET /api/plants/banana -> 400
```

Verify:

```text
message
issues
```

and verify service was not called.

### GET missing

Mock `getById` -> `null`.

Expect 404.

### POST valid

Valid body -> 201.

### POST invalid

Invalid body -> 400.

Verify native Zod `issues`.

Verify service `create` was not called.

### PUT valid

Valid ID/body -> 200.

Verify numeric ID and validated body reach service.

### PUT invalid

Invalid body -> 400 with `issues`.

### DELETE

Valid deletion -> 204.

### Unknown route

```text
GET /api/banana-reactor -> 404 JSON
```

not Express HTML.

---

## 27. Zod assertions in route tests

Explicitly test that invalid data is rejected before the service.

Example style:

```ts
expect(response.status).toBe(400);

expect(response.body).toHaveProperty(
  "message",
  "Błąd walidacji danych"
);

expect(response.body.issues).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ path: ["name"] }),
    expect.objectContaining({ path: ["wateringIntervalDays"] }),
  ])
);

expect(PlantService.prototype.create).not.toHaveBeenCalled();
```

Do not assert every version-specific field of a Zod issue.

Assert stable, important properties such as `path` and `message`.

---

## 28. Error behavior tests

Ensure an unexpected service/controller error:

- reaches the common error handler
- returns 500
- returns `{ "message": "Wewnętrzny błąd serwera" }`
- does not expose a stack trace

Also verify missing-record update/delete becomes 404 if handled through Prisma's known not-found error.

---

## 29. Environment and gitignore

Create:

```text
.env
.env.example
```

`.env.example`:

```env
DATABASE_URL="postgresql://admin:sekretnehaslo@localhost:5432/office_plant_db?schema=public"
PORT=3000
NODE_ENV=development
```

Ignore at least:

```text
node_modules/
dist/
coverage/
.env
generated/prisma/
```

Do not ignore:

```text
.env.example
prisma/migrations/
```

---

## 30. README

Create a short README describing:

- project purpose
- stack
- npm install
- Docker PostgreSQL command
- `.env`
- Prisma migrate/generate/seed
- `npm run dev`
- `npm run build`
- `npm test`
- endpoints

Do not write a huge tutorial.

---

## 31. Forbidden architecture

Do NOT create any of these:

```text
Repository Pattern
Generic Repository
PlantRepository
IPlantRepository
Repository<T>

DI Container
Inversify
tsyringe
NestJS DI

Service Factory
Controller Factory
dependency factory

Clean Architecture
Hexagonal Architecture
Onion Architecture
Ports and Adapters

DDD
aggregates
value objects
domain events

CQRS
commands
queries
handlers

use-case classes

PlantEntity
PlantDomain
domain/
entities/

BaseController
BaseService
BaseRepository
```

Allowed and expected:

```text
Controller
Service
Router
DTO
Zod schema
validation middleware
Mapper
Prisma Client
Winston logger
global error handler
```

---

## 32. Intended architecture

Dependency construction:

```text
src/db.ts
   ↓
prisma singleton
   ↓
plantRouter.ts
   ├── new PlantService(prisma)
   └── new PlantController(plantService)
```

Request flow:

```text
HTTP
 ↓
app.ts
 ↓
Morgan -> Winston
 ↓
plantRouter
 ↓
validateParams / validateBody
 ↓
PlantController
 ↓
PlantService
 ↓
Prisma
 ↓
PostgreSQL
```

Response flow:

```text
Prisma Plant
 ↓
PlantMapper
 ↓
PlantResponseDTO
 ↓
Controller
 ↓
JSON
```

Validation failure:

```text
ZodError
 ↓
error.issues
 ↓
400
```

Unexpected failure:

```text
Controller/Service
 ↓
next(error)
 ↓
errorHandler
 ↓
Winston
 ↓
404 or 500
```

---

## 33. Implementation principles

Prefer explicit code:

```ts
const plantService = new PlantService(prisma);
const plantController = new PlantController(plantService);
```

Prefer direct Prisma in the service:

```ts
this.prisma.plant.findMany()
```

Prefer Zod inference:

```ts
export type CreatePlantRequestDTO =
  z.infer<typeof CreatePlantRequestSchema>;
```

Prefer parsed request replacement:

```ts
req.body = schema.parse(req.body);
req.params = schema.parse(req.params) as any;
```

Prefer native:

```ts
error.issues
```

Prefer a small static mapper instead of a domain layer.

This is a conventional layered Express project, not an architecture showcase.

---

## 34. Work autonomously

Actually perform the implementation.

Do not stop after creating folders or example snippets.

Do all of the following:

1. create project directory
2. `npm init -y`
3. install dependencies
4. configure TypeScript
5. initialize Prisma
6. start/reuse PostgreSQL Docker container
7. create schema and migration
8. generate Prisma Client
9. create `db.ts`
10. create DTOs/schemas
11. create validation middleware
12. create mapper
13. create service
14. create controller
15. create router
16. configure Winston
17. configure Morgan
18. create common error handler
19. create `app.ts`
20. create `index.ts`
21. create/run seed
22. write service tests
23. write controller tests
24. write route tests
25. create README
26. run build/tests
27. fix failures

Do not ask the user to manually do steps you can perform.

---

## 35. Verification

Before finishing, run:

```bash
npx prisma generate
npm run build
npm run test:services
npm run test:controllers
npm run test:routes
npm test
```

When PostgreSQL/Docker is available, also verify:

```bash
npx prisma migrate dev
npx prisma db seed
```

Perform a minimal runtime/database sanity check.

If something fails, fix it and rerun.

Do not finish with known TypeScript errors, Prisma generation errors, broken scripts, or failing tests.

---

## 36. Acceptance criteria

The project is complete only when:

- PostgreSQL is used
- exactly one `Plant` model exists
- Prisma Client is generated to `generated/prisma`
- `src/db.ts` owns one application Prisma singleton
- `PlantService` receives Prisma in its constructor
- router uses `new PlantService(prisma)`
- router uses `new PlantController(plantService)`
- no repository exists
- no DI container/factory exists
- no separate domain entity exists
- `src/dtos/plantDto.ts` contains schemas/DTOs
- `CreatePlantRequestDTO` is `z.infer<typeof CreatePlantRequestSchema>`
- no duplicated request interface exists
- `IdParamSchema` uses `z.coerce.number()`
- `PlantResponseDTO` exists
- `PlantMapper` exists
- `validationMiddleware.ts` exports `validateBody` and `validateParams`
- body middleware replaces `req.body`
- params middleware replaces `req.params`
- validation errors contain native Zod `issues`
- `PlantService` is a class
- `PlantController` is a class
- service has no Express dependency
- controller has no Prisma calls
- CRUD uses GET/POST/PUT/DELETE
- PUT is full update using `CreatePlantRequestDTO`
- DELETE returns 204 with no body
- Morgan logs through Winston
- common error handler exists
- `app.ts` does not listen
- `index.ts` starts the server
- tests live in `tests/controllers`, `tests/routes`, `tests/services`
- service tests mock Prisma
- controller tests mock Service
- route tests use Supertest and mocked/spied Service
- invalid Zod requests do not reach Service
- seed exists
- README exists
- build succeeds
- all tests pass

Most importantly:

```text
NO Repository
NO DI Container
NO Dependency Factory
NO separate Domain Entity
NO Clean Architecture
NO DDD
NO CQRS
```
