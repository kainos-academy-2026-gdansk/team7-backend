# Kainos Work - Team 7

Backend service for the Kainos Work job application platform. Built with Express 5, TypeScript and Prisma (PostgreSQL).

## Problem statement

Currently within Kainos there is not one source of truth to view job roles and the relevant information attached (for example job descriptions, capability, competencies, banding, training). This can be confusing and time consuming for employees to retrieve the relevant job role information.

## Vision

An online job application that serves both Kainos recruitment admins, who retrieve and update job roles and their relevant information, and applicants, who apply for roles.

This repository provides the API layer for that platform: it exposes job roles together with their band and capability data, and backs the admin and applicant workflows.

## Requirements

- Node.js 22+
- npm
- PostgreSQL 16 (Docker or native install)

## Installation

```bash
npm install
```

## Environment configuration

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/kainos_work-db?schema=public"
```

`.env` must not be committed to the repository - keep local credentials there only.

## Database

### Option A - PostgreSQL in Docker (recommended)

```bash
docker run --name kainos-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=kainos_work-db \
  -p 5432:5432 \
  -v kainos-pgdata:/var/lib/postgresql/data \
  -d postgres:16
```

Container management:

```bash
docker start kainos-postgres   # start again
docker stop kainos-postgres    # stop
docker logs -f kainos-postgres # follow logs
```

Connect with psql inside the container:

```bash
docker exec -it kainos-postgres psql -U postgres -d kainos_work-db
```

### Option B - PostgreSQL native (macOS / Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16

createdb kainos_work-db
```

If the local `postgres` role does not exist:

```bash
psql -d postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'password';"
```

Connect with psql:

```bash
psql -h localhost -U postgres -d kainos_work-db
```

`DATABASE_URL` is identical for both options.

### Prisma migrations and client

```bash
npx prisma migrate dev --name init   # create a migration and apply it to the database
npx prisma generate                  # generate the Prisma client
npx prisma studio                    # data browser (http://localhost:5555)
```

## Running the app

| Command | Description |
| --- | --- |
| `npm run dev` | Development mode - `tsx watch src/index.ts`, restarts on file changes |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled app (`node dist/index.js`) |

Typical workflow:

```bash
npm install
docker start kainos-postgres
npx prisma migrate dev
npm run dev
```

The app listens on the port from `PORT` (default `3000`): http://localhost:3000

## Tests

| Command | Description |
| --- | --- |
| `npm test` | Single test run (Vitest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with a coverage report |

## Code quality (Biome)

| Command | Description |
| --- | --- |
| `npm run format` | Format files |
| `npm run lint` | Check lint rules |
| `npm run lint:fix` | Apply safe automatic fixes |
| `npm run lint:fix:unsafe` | Apply fixes including unsafe rules |
| `npm run check` | Format + lint, writing changes |
| `npm run ci:check` | CI verification (no writes) |

## Project structure

```
prisma/schema.prisma   # data model
src/app.ts             # Express application setup
src/index.ts           # entry point (server start)
tests/                 # Vitest + Supertest tests
postman/               # Postman collection
```

## Troubleshooting

- `A datasource block is missing in the Prisma schema file` - save `prisma/schema.prisma`; the file may still be empty on disk.
- `Can't reach database server at localhost:5432` - the container is not running (`docker start kainos-postgres`) or the native service is stopped.
- `port is already allocated` - port 5432 is taken by another PostgreSQL instance; stop it or map the container to a different port (for example `-p 5433:5432`) and update `DATABASE_URL`.
