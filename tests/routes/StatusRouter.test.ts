import { execSync } from "node:child_process";
import type { PrismaClient } from "@prisma/client";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type Express from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const CONTAINER_TIMEOUT_MS = 120_000;

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let app: Express.Application;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  process.env.DATABASE_URL = container.getConnectionUri();

  execSync("npx prisma migrate deploy", { stdio: "inherit" });

  prisma = (await import("../../src/prismaClient")).default;
  app = (await import("../../src/app")).default;
}, CONTAINER_TIMEOUT_MS);

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

describe("GET /api/statuses", () => {
  it("returns 200 with the statuses seeded by the migration", async () => {
    const response = await request(app).get("/api/statuses");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { statusId: expect.any(Number), statusName: "OPEN" },
      { statusId: expect.any(Number), statusName: "CLOSED" },
    ]);
  });

  it("returns 500 when the database query fails", async () => {
    vi.spyOn(prisma.status, "findMany").mockRejectedValueOnce(new Error("Statuses query failed"));

    const response = await request(app).get("/api/statuses");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Statuses query failed" });
  });
});
