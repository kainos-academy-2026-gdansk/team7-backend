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
let seededCapabilityId: number;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  process.env.DATABASE_URL = container.getConnectionUri();

  execSync("npx prisma migrate deploy", { stdio: "inherit" });

  prisma = (await import("../../src/prismaClient")).default;
  app = (await import("../../src/app")).default;

  const capability = await prisma.capability.create({ data: { name: "Engineering" } });
  seededCapabilityId = capability.id;
}, CONTAINER_TIMEOUT_MS);

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

describe("GET /api/capabilities", () => {
  it("returns 200 with available capabilities", async () => {
    const response = await request(app).get("/api/capabilities");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: seededCapabilityId, name: "Engineering" }]);
  });

  it("returns 500 when the database query fails", async () => {
    vi.spyOn(prisma.capability, "findMany").mockRejectedValueOnce(
      new Error("Capabilities query failed"),
    );

    const response = await request(app).get("/api/capabilities");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Capabilities query failed" });
  });
});
