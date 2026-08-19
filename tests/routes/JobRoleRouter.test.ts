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
let seededJobRoleId: number;
let seededBandId: number;
let seededCapabilityId: number;
let openStatusId: number;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.JWT_SECRET = "test-secret";

  execSync("npx prisma migrate deploy", { stdio: "inherit" });

  prisma = (await import("../../src/prismaClient")).default;
  app = (await import("../../src/app")).default;

  const openStatus = await prisma.status.findUniqueOrThrow({ where: { statusName: "OPEN" } });
  openStatusId = openStatus.statusId;

  const band = await prisma.band.create({ data: { name: "Senior Associate" } });
  const capability = await prisma.capability.create({ data: { name: "Engineering" } });
  seededBandId = band.id;
  seededCapabilityId = capability.id;
  const jobRole = await prisma.jobRole.create({
    data: {
      roleName: "Software Engineer",
      location: "Gdansk",
      statusId: openStatusId,
      description: "Builds things",
      responsibilities: "Writes code",
      numberOfOpenPositions: 3,
      sharepointUrl: "https://example.com/role/1",
      bandId: seededBandId,
      capabilityId: seededCapabilityId,
    },
  });

  seededJobRoleId = jobRole.id;
}, CONTAINER_TIMEOUT_MS);

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

describe("GET /api/job-roles", () => {
  it("returns 200 with all roles", async () => {
    const response = await request(app).get("/api/job-roles");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: seededJobRoleId,
        roleName: "Software Engineer",
        location: "Gdansk",
        capability: "Engineering",
        band: "Senior Associate",
        closingDate: null,
        status: "OPEN",
      },
    ]);
  });

  it("returns 200 with an empty list when there are no roles", async () => {
    vi.spyOn(prisma.jobRole, "findMany").mockResolvedValueOnce([]);

    const response = await request(app).get("/api/job-roles");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns 500 when the database query fails", async () => {
    vi.spyOn(prisma.jobRole, "findMany").mockRejectedValueOnce(
      new Error("Database connection failed"),
    );

    const response = await request(app).get("/api/job-roles");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database connection failed" });
  });
});

describe("GET /api/job-roles/:id", () => {
  it("returns 200 with the flattened job role dto", async () => {
    const response = await request(app).get(`/api/job-roles/${seededJobRoleId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: seededJobRoleId,
      jobRoleName: "Software Engineer",
      description: "Builds things",
      responsibilities: "Writes code",
      sharepointUrl: "https://example.com/role/1",
      location: "Gdansk",
      capability: "Engineering",
      band: "Senior Associate",
      closingDate: null,
      status: "OPEN",
      numberOfOpenPositions: 3,
    });
  });

  it("returns 404 when the job role does not exist", async () => {
    const response = await request(app).get("/api/job-roles/9999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Job role not found" });
  });

  it("returns 400 when the id is not a positive integer", async () => {
    const response = await request(app).get("/api/job-roles/abc");

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "id", message: "Id must be a positive integer" },
    ]);
  });
});
