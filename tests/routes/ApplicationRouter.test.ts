import { execSync } from "node:child_process";
import { type Prisma, type PrismaClient, Role } from "@prisma/client";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type Express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signToken } from "../../src/lib/jwt";

const CONTAINER_TIMEOUT_MS = 120_000;

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let app: Express.Application;
let openStatusId: number;
let closedStatusId: number;
let inProgressStatusId: number;
let userId: number;
let secondUserId: number;
let userToken: string;
let secondUserToken: string;
let adminToken: string;
let bandId: number;
let capabilityId: number;
let roleSequence = 0;

const applicationBody = {
  experience: "Three years building backend services",
  salaryExpectation: "60000 GBP annually",
  skills: "TypeScript, Node.js, PostgreSQL",
};

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.JWT_SECRET = "test-secret";

  execSync("npx prisma migrate deploy", { stdio: "inherit" });

  prisma = (await import("../../src/prismaClient")).default;
  app = (await import("../../src/app")).default;

  const openStatus = await prisma.status.findUniqueOrThrow({ where: { statusName: "OPEN" } });
  const closedStatus = await prisma.status.findUniqueOrThrow({ where: { statusName: "CLOSED" } });
  const inProgressStatus = await prisma.status.findUniqueOrThrow({
    where: { statusName: "IN_PROGRESS" },
  });
  openStatusId = openStatus.statusId;
  closedStatusId = closedStatus.statusId;
  inProgressStatusId = inProgressStatus.statusId;

  const band = await prisma.band.create({ data: { name: "Senior Associate" } });
  const capability = await prisma.capability.create({ data: { name: "Engineering" } });
  bandId = band.id;
  capabilityId = capability.id;

  const user = await prisma.user.create({
    data: {
      email: "application-user@example.com",
      passwordHash: "not-used-in-route-tests",
      role: Role.USER,
    },
  });
  const secondUser = await prisma.user.create({
    data: {
      email: "second-application-user@example.com",
      passwordHash: "not-used-in-route-tests",
      role: Role.USER,
    },
  });
  userId = user.id;
  secondUserId = secondUser.id;
  userToken = signToken({ sub: user.id, email: user.email, role: user.role });
  secondUserToken = signToken({
    sub: secondUser.id,
    email: secondUser.email,
    role: secondUser.role,
  });
  adminToken = signToken({ sub: 999, email: "admin@example.com", role: Role.ADMIN });
}, CONTAINER_TIMEOUT_MS);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

async function createJobRole(
  overrides: Partial<Prisma.JobRoleUncheckedCreateInput> = {},
): Promise<{ id: number; roleName: string }> {
  roleSequence += 1;
  return await prisma.jobRole.create({
    data: {
      roleName: `Application Test Role ${roleSequence}`,
      location: "Gdansk",
      statusId: openStatusId,
      bandId,
      capabilityId,
      numberOfOpenPositions: 2,
      ...overrides,
    },
    select: { id: true, roleName: true },
  });
}

describe("POST /api/job-roles/:id/apply", () => {
  it("creates an IN_PROGRESS application for an eligible USER", async () => {
    const role = await createJobRole();

    const response = await request(app)
      .post(`/api/job-roles/${role.id}/apply`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(applicationBody);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      jobRoleId: role.id,
      roleName: role.roleName,
      ...applicationBody,
      status: "IN_PROGRESS",
    });

    const savedApplication = await prisma.application.findUniqueOrThrow({
      where: { id: response.body.id },
    });
    expect(savedApplication.applicantId).toBe(userId);
    expect(savedApplication.statusId).toBe(inProgressStatusId);
  });

  it("trims whitespace before persisting values at their maximum lengths", async () => {
    const role = await createJobRole();
    const paddedBody = {
      experience: `${"a".repeat(1000)}  `,
      salaryExpectation: `${"b".repeat(100)}  `,
      skills: `${"c".repeat(2000)}  `,
    };

    const response = await request(app)
      .post(`/api/job-roles/${role.id}/apply`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(paddedBody);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      experience: "a".repeat(1000),
      salaryExpectation: "b".repeat(100),
      skills: "c".repeat(2000),
    });
  });

  it("returns 401 when no token is provided", async () => {
    const role = await createJobRole();

    const response = await request(app)
      .post(`/api/job-roles/${role.id}/apply`)
      .send(applicationBody);

    expect(response.status).toBe(401);
  });

  it("returns 403 for an ADMIN token", async () => {
    const role = await createJobRole();

    const response = await request(app)
      .post(`/api/job-roles/${role.id}/apply`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(applicationBody);

    expect(response.status).toBe(403);
  });

  it("returns 400 and does not create an application for invalid input", async () => {
    const role = await createJobRole();
    const beforeCount = await prisma.application.count({ where: { applicantId: userId } });

    const response = await request(app)
      .post(`/api/job-roles/${role.id}/apply`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ...applicationBody, cv: "deferred" });

    expect(response.status).toBe(400);
    expect(await prisma.application.count({ where: { applicantId: userId } })).toBe(beforeCount);
  });

  it("returns 404 when the job role does not exist", async () => {
    const response = await request(app)
      .post("/api/job-roles/999999/apply")
      .set("Authorization", `Bearer ${userToken}`)
      .send(applicationBody);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Job role not found" });
  });

  it.each(["closed", "zero positions", "null positions"])(
    "returns 409 when the role is not accepting applications (%s)",
    async (caseName) => {
      const roleData =
        caseName === "closed"
          ? { statusId: closedStatusId, numberOfOpenPositions: 2 }
          : {
              statusId: openStatusId,
              numberOfOpenPositions: caseName === "zero positions" ? 0 : null,
            };
      const role = await createJobRole(roleData);

      const response = await request(app)
        .post(`/api/job-roles/${role.id}/apply`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(applicationBody);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: "Job role is not accepting applications" });
    },
  );

  it("returns 409 when the USER has already applied for the role", async () => {
    const role = await createJobRole();
    const firstResponse = await request(app)
      .post(`/api/job-roles/${role.id}/apply`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(applicationBody);

    const duplicateResponse = await request(app)
      .post(`/api/job-roles/${role.id}/apply`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(applicationBody);

    expect(firstResponse.status).toBe(201);
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body).toEqual({
      message: "You have already applied for this job role",
    });
  });

  it("returns 400 when the role id is invalid", async () => {
    const response = await request(app)
      .post("/api/job-roles/not-an-id/apply")
      .set("Authorization", `Bearer ${userToken}`)
      .send(applicationBody);

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "id", message: "Id must be a positive integer" },
    ]);
  });
});

describe("GET /api/applications", () => {
  it("returns an empty list when the USER has no applications", async () => {
    const newUser = await prisma.user.create({
      data: {
        email: `empty-application-user-${Date.now()}@example.com`,
        passwordHash: "not-used-in-route-tests",
        role: Role.USER,
      },
    });
    const token = signToken({ sub: newUser.id, email: newUser.email, role: newUser.role });

    const response = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns only the USER's applications oldest first", async () => {
    const oldestRole = await createJobRole();
    const newestRole = await createJobRole();
    const otherApplicantRole = await createJobRole();
    const oldestCreatedAt = new Date("2026-08-01T10:00:00.000Z");
    const newestCreatedAt = new Date("2026-08-02T10:00:00.000Z");

    const oldest = await prisma.application.create({
      data: {
        applicantId: secondUserId,
        jobRoleId: oldestRole.id,
        statusId: inProgressStatusId,
        ...applicationBody,
        createdAt: oldestCreatedAt,
        updatedAt: oldestCreatedAt,
      },
    });
    const newest = await prisma.application.create({
      data: {
        applicantId: secondUserId,
        jobRoleId: newestRole.id,
        statusId: inProgressStatusId,
        ...applicationBody,
        createdAt: newestCreatedAt,
        updatedAt: newestCreatedAt,
      },
    });
    await prisma.application.create({
      data: {
        applicantId: userId,
        jobRoleId: otherApplicantRole.id,
        statusId: inProgressStatusId,
        ...applicationBody,
      },
    });

    const response = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${secondUserToken}`);

    expect(response.status).toBe(200);
    expect(response.body.map((item: { id: number }) => item.id)).toEqual([oldest.id, newest.id]);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: oldest.id,
        jobRoleId: oldestRole.id,
        roleName: oldestRole.roleName,
        status: "IN_PROGRESS",
      }),
      expect.objectContaining({
        id: newest.id,
        jobRoleId: newestRole.id,
        roleName: newestRole.roleName,
        status: "IN_PROGRESS",
      }),
    ]);
  });

  it("returns 401 without a token and 403 for an ADMIN token", async () => {
    const unauthenticatedResponse = await request(app).get("/api/applications");
    const adminResponse = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(unauthenticatedResponse.status).toBe(401);
    expect(adminResponse.status).toBe(403);
  });
});
