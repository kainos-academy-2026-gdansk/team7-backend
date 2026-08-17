import { execSync } from "node:child_process";
import { type Prisma, type PrismaClient, Role } from "@prisma/client";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type Express from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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
  adminToken = signToken({ sub: 999, email: "admin@example.com", role: Role.ADMIN });
}, CONTAINER_TIMEOUT_MS);

afterEach(() => {
  vi.restoreAllMocks();
});

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

describe("POST /api/admin/job-roles", () => {
  it("returns 401 when no token is provided", async () => {
    const response = await request(app).post("/api/admin/job-roles").send({});

    expect(response.status).toBe(401);
  });

  it("returns 403 when a USER token is provided", async () => {
    const response = await request(app)
      .post("/api/admin/job-roles")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(response.status).toBe(403);
  });

  it("returns 201 with created role dto for a valid payload", async () => {
    const response = await request(app)
      .post("/api/admin/job-roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roleName: "Data Engineer",
        location: "Warsaw",
        bandId,
        capabilityId,
        description: "Builds data pipelines",
        responsibilities: "Designs ETL jobs",
        numberOfOpenPositions: 2,
        sharepointUrl: "https://example.com/role/new",
        closingDate: "2026-11-30T00:00:00.000Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      roleName: "Data Engineer",
      location: "Warsaw",
      status: "OPEN",
      band: "Senior Associate",
      capability: "Engineering",
      description: "Builds data pipelines",
      responsibilities: "Designs ETL jobs",
      numberOfOpenPositions: 2,
      sharepointUrl: "https://example.com/role/new",
      closingDate: "2026-11-30T00:00:00.000Z",
    });
    expect(typeof response.body.id).toBe("number");

    await prisma.jobRole.delete({ where: { id: response.body.id } });
  });

  it("returns 201 when nullable optional fields are null and numberOfOpenPositions is 0", async () => {
    const response = await request(app)
      .post("/api/admin/job-roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roleName: "Platform Engineer",
        location: "Remote",
        bandId,
        capabilityId,
        description: null,
        responsibilities: null,
        numberOfOpenPositions: 0,
        sharepointUrl: null,
        closingDate: null,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      roleName: "Platform Engineer",
      location: "Remote",
      status: "OPEN",
      band: "Senior Associate",
      capability: "Engineering",
      description: null,
      responsibilities: null,
      numberOfOpenPositions: 0,
      sharepointUrl: null,
      closingDate: null,
    });

    await prisma.jobRole.delete({ where: { id: response.body.id } });
  });

  it("returns 400 when a required field is missing", async () => {
    const response = await request(app)
      .post("/api/admin/job-roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        location: "Warsaw",
        bandId,
        capabilityId,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: "roleName",
      message: "Invalid input: expected string, received undefined",
    });
  });

  it("returns 201 and always creates the role with the OPEN status", async () => {
    const response = await request(app)
      .post("/api/admin/job-roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roleName: "Integration Engineer",
        location: "Warsaw",
        bandId,
        capabilityId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      roleName: "Integration Engineer",
      status: "OPEN",
      band: "Senior Associate",
      capability: "Engineering",
    });

    const created = await prisma.jobRole.findUnique({ where: { id: response.body.id } });
    expect(created?.statusId).toBe(openStatusId);

    await prisma.jobRole.delete({ where: { id: response.body.id } });
  });

  it("returns 400 when the client sends a status", async () => {
    const response = await request(app)
      .post("/api/admin/job-roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roleName: "Integration Engineer",
        location: "Warsaw",
        statusId: closedStatusId,
        bandId,
        capabilityId,
      });

    expect(response.status).toBe(400);
  });

  it("returns 400 when the pre-rename field names are sent", async () => {
    const response = await request(app)
      .post("/api/admin/job-roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roleName: "Integration Engineer",
        location: "Warsaw",
        bandId,
        capabilityId,
        openPositions: 2,
        sharePointLink: "https://example.com/role/legacy",
      });

    expect(response.status).toBe(400);
  });

  it("returns 400 when closingDate is not a valid datetime", async () => {
    const response = await request(app)
      .post("/api/admin/job-roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roleName: "QA Engineer",
        location: "Krakow",
        bandId,
        capabilityId,
        closingDate: "31-12-2026",
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: "closingDate",
      message: "Invalid ISO datetime",
    });
  });

  it("returns 500 when database insert fails", async () => {
    vi.spyOn(prisma.jobRole, "create").mockRejectedValueOnce(new Error("Insert failed"));

    const response = await request(app)
      .post("/api/admin/job-roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        roleName: "Data Engineer",
        location: "Warsaw",
        bandId,
        capabilityId,
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Insert failed" });
  });
});

describe("PUT /api/admin/job-roles/:id", () => {
  let editableJobRoleId: number;
  let validBody: Record<string, unknown>;

  beforeAll(async () => {
    validBody = {
      jobRoleName: "Lead Software Engineer",
      location: "Belfast",
      statusId: closedStatusId,
      bandName: "Consultant",
      capabilityName: "Testing",
      description: "Leads delivery teams.",
      responsibilities: "Owns technical direction.",
      sharepointUrl: "https://example.com/role/updated",
      numberOfOpenPositions: 7,
      closingDate: "2027-01-31T23:59:59.000Z",
    };

    await prisma.band.create({ data: { name: "Consultant" } });
    await prisma.capability.create({ data: { name: "Testing" } });

    const jobRole = await createJobRole({
      roleName: "Editable Role",
      description: "Before update",
      responsibilities: "Before update",
      numberOfOpenPositions: 1,
      sharepointUrl: "https://example.com/role/before",
    });

    editableJobRoleId = jobRole.id;
  });

  it("returns 401 when no token is provided", async () => {
    const response = await request(app).put(`/api/admin/job-roles/${editableJobRoleId}`).send({});

    expect(response.status).toBe(401);
  });

  it("returns 403 when a USER token is provided", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(response.status).toBe(403);
  });

  it("returns 200 with the updated dto and persists the change", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: editableJobRoleId,
      jobRoleName: "Lead Software Engineer",
      description: "Leads delivery teams.",
      responsibilities: "Owns technical direction.",
      sharepointUrl: "https://example.com/role/updated",
      location: "Belfast",
      capability: "Testing",
      band: "Consultant",
      closingDate: "2027-01-31T23:59:59.000Z",
      status: "CLOSED",
      numberOfOpenPositions: 7,
    });

    const reread = await request(app).get(`/api/job-roles/${editableJobRoleId}`);
    expect(reread.body).toEqual(response.body);
  });

  it("clears nullable fields when null is sent", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...validBody,
        description: null,
        responsibilities: null,
        sharepointUrl: null,
        numberOfOpenPositions: null,
        closingDate: null,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      description: null,
      sharepointUrl: null,
      closingDate: null,
    });
  });

  it("returns 404 when the job role does not exist", async () => {
    const response = await request(app)
      .put("/api/admin/job-roles/9999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validBody);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Job role not found" });
  });

  it("returns 400 when the id is not a positive integer", async () => {
    const response = await request(app)
      .put("/api/admin/job-roles/abc")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validBody);

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "id", message: "Id must be a positive integer" },
    ]);
  });

  it("returns 400 when a required field is missing", async () => {
    const { location, ...bodyWithoutLocation } = validBody;

    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(bodyWithoutLocation);

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(expect.objectContaining({ field: "location" }));
  });

  it("returns 400 when statusId is not a positive integer", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, statusId: 0 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(expect.objectContaining({ field: "statusId" }));
  });

  it("returns 400 when the statusId does not exist", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, statusId: 9999 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(expect.objectContaining({ field: "statusId" }));
  });

  it("returns 400 when an unknown field is sent", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, id: 99 });

    expect(response.status).toBe(400);
  });

  it("returns 400 when sharepointUrl is not a url", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, sharepointUrl: "not-a-url" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: "sharepointUrl" }),
    );
  });

  it("returns 400 when numberOfOpenPositions is negative", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, numberOfOpenPositions: -1 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: "numberOfOpenPositions" }),
    );
  });

  it("returns 400 when the band name does not exist", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, bandName: "Nonexistent Band" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(expect.objectContaining({ field: "bandName" }));
  });

  it("returns 400 when the capability name does not exist", async () => {
    const response = await request(app)
      .put(`/api/admin/job-roles/${editableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validBody, capabilityName: "Nonexistent Capability" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: "capabilityName" }),
    );
  });
});

describe("DELETE /api/admin/job-roles/:id", () => {
  let deletableJobRoleId: number;

  beforeEach(async () => {
    const jobRole = await createJobRole({ roleName: "Deletable Role" });
    deletableJobRoleId = jobRole.id;
  });

  it("returns 401 when no token is provided", async () => {
    const response = await request(app).delete(`/api/admin/job-roles/${deletableJobRoleId}`);

    expect(response.status).toBe(401);
  });

  it("returns 403 when a USER token is provided", async () => {
    const response = await request(app)
      .delete(`/api/admin/job-roles/${deletableJobRoleId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  it("returns 204 with an empty body when the job role is deleted", async () => {
    const response = await request(app)
      .delete(`/api/admin/job-roles/${deletableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("removes the job role from the database", async () => {
    await request(app)
      .delete(`/api/admin/job-roles/${deletableJobRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const reread = await request(app).get(`/api/job-roles/${deletableJobRoleId}`);

    expect(reread.status).toBe(404);
  });

  it("returns 404 when the job role does not exist", async () => {
    const response = await request(app)
      .delete("/api/admin/job-roles/999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Job role not found" });
  });

  it("returns 400 when the id is not a positive integer", async () => {
    const response = await request(app)
      .delete("/api/admin/job-roles/abc")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(expect.objectContaining({ field: "id" }));
  });
});

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
