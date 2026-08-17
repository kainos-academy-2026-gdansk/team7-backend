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
let inProgressStatusId: number;
let userId: number;
let secondUserId: number;
let userToken: string;
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
  const inProgressStatus = await prisma.status.findUniqueOrThrow({
    where: { statusName: "IN_PROGRESS" },
  });
  openStatusId = openStatus.statusId;
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

async function createApplicationForAssessment(numberOfOpenPositions: number | null) {
  const role = await createJobRole({ numberOfOpenPositions });
  const applicant = await prisma.user.create({
    data: {
      email: `assessment-applicant-${role.id}@example.com`,
      passwordHash: "not-used-in-route-tests",
      role: Role.USER,
    },
  });
  const application = await prisma.application.create({
    data: {
      applicantId: applicant.id,
      jobRoleId: role.id,
      statusId: inProgressStatusId,
      ...applicationBody,
    },
  });
  return { role, application, applicant };
}

describe("GET /api/admin/job-roles/:id/applications", () => {
  it("lists applications for an existing role without exposing credentials", async () => {
    const { role, application, applicant } = await createApplicationForAssessment(2);

    const response = await request(app)
      .get(`/api/admin/job-roles/${role.id}/applications`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: application.id,
        applicantEmail: applicant.email,
        status: "IN_PROGRESS",
      }),
    ]);
    expect(response.body[0]).not.toHaveProperty("passwordHash");
  });

  it("returns an empty list, not found, validation, and authorization responses", async () => {
    const role = await createJobRole();
    expect(
      (
        await request(app)
          .get(`/api/admin/job-roles/${role.id}/applications`)
          .set("Authorization", `Bearer ${adminToken}`)
      ).body,
    ).toEqual([]);
    expect(
      (
        await request(app)
          .get("/api/admin/job-roles/999999/applications")
          .set("Authorization", `Bearer ${adminToken}`)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get("/api/admin/job-roles/not-an-id/applications")
          .set("Authorization", `Bearer ${adminToken}`)
      ).status,
    ).toBe(400);
    expect((await request(app).get(`/api/admin/job-roles/${role.id}/applications`)).status).toBe(
      401,
    );
    expect(
      (
        await request(app)
          .get(`/api/admin/job-roles/${role.id}/applications`)
          .set("Authorization", `Bearer ${userToken}`)
      ).status,
    ).toBe(403);
  });
});

describe("PATCH /api/admin/job-roles/:id/applications/:applicationId", () => {
  it("hires an application and decrements open positions", async () => {
    const { role, application } = await createApplicationForAssessment(1);
    const response = await request(app)
      .patch(`/api/admin/job-roles/${role.id}/applications/${application.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "HIRED" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      application: { id: application.id, status: "HIRED" },
      numberOfOpenPositions: 0,
    });
  });

  it("rejects without changing open positions", async () => {
    const { role, application } = await createApplicationForAssessment(2);
    const response = await request(app)
      .patch(`/api/admin/job-roles/${role.id}/applications/${application.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "REJECTED" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      application: { status: "REJECTED" },
      numberOfOpenPositions: 2,
    });
  });

  it("rejects unavailable positions and invalid status input", async () => {
    const { role, application } = await createApplicationForAssessment(0);
    expect(
      (
        await request(app)
          .patch(`/api/admin/job-roles/${role.id}/applications/${application.id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: "HIRED" })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .patch(`/api/admin/job-roles/${role.id}/applications/${application.id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: "OPEN" })
      ).status,
    ).toBe(400);
  });
});

describe("GET /api/admin/applications", () => {
  it("lists applications across every job role newest first without exposing credentials", async () => {
    const firstRole = await createJobRole();
    const secondRole = await createJobRole();
    const olderCreatedAt = new Date("2026-08-03T10:00:00.000Z");
    const newerCreatedAt = new Date("2026-08-04T10:00:00.000Z");

    const older = await prisma.application.create({
      data: {
        applicantId: userId,
        jobRoleId: firstRole.id,
        statusId: inProgressStatusId,
        ...applicationBody,
        createdAt: olderCreatedAt,
        updatedAt: olderCreatedAt,
      },
    });
    const newer = await prisma.application.create({
      data: {
        applicantId: secondUserId,
        jobRoleId: secondRole.id,
        statusId: inProgressStatusId,
        ...applicationBody,
        createdAt: newerCreatedAt,
        updatedAt: newerCreatedAt,
      },
    });

    const response = await request(app)
      .get("/api/admin/applications")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const relevantItems = response.body.filter((item: { id: number }) =>
      [older.id, newer.id].includes(item.id),
    );
    expect(relevantItems).toEqual([
      {
        id: newer.id,
        jobRoleName: secondRole.roleName,
        applicantEmail: "second-application-user@example.com",
        status: "IN_PROGRESS",
        experience: applicationBody.experience,
        salaryExpectation: applicationBody.salaryExpectation,
        skills: applicationBody.skills,
        createdAt: newerCreatedAt.toISOString(),
        updatedAt: newerCreatedAt.toISOString(),
      },
      {
        id: older.id,
        jobRoleName: firstRole.roleName,
        applicantEmail: "application-user@example.com",
        status: "IN_PROGRESS",
        experience: applicationBody.experience,
        salaryExpectation: applicationBody.salaryExpectation,
        skills: applicationBody.skills,
        createdAt: olderCreatedAt.toISOString(),
        updatedAt: olderCreatedAt.toISOString(),
      },
    ]);
  });

  it("returns an empty list, 401, and 403 responses", async () => {
    const emptyResponse = await request(app)
      .get("/api/admin/applications")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(emptyResponse.status).toBe(200);
    expect(Array.isArray(emptyResponse.body)).toBe(true);

    expect((await request(app).get("/api/admin/applications")).status).toBe(401);
    expect(
      (
        await request(app)
          .get("/api/admin/applications")
          .set("Authorization", `Bearer ${userToken}`)
      ).status,
    ).toBe(403);
  });
});
