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

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  process.env.DATABASE_URL = container.getConnectionUri();

  execSync("npx prisma migrate deploy", { stdio: "inherit" });

  // dynamiczny import - prismaClient.ts czyta DATABASE_URL przy starcie modulu
  prisma = (await import("../../src/prismaClient")).default;
  app = (await import("../../src/app")).default;

  const band = await prisma.band.create({ data: { name: "Senior Associate" } });
  const capability = await prisma.capability.create({ data: { name: "Engineering" } });
  seededBandId = band.id;
  seededCapabilityId = capability.id;
  const jobRole = await prisma.jobRole.create({
    data: {
      roleName: "Software Engineer",
      location: "Gdansk",
      status: "OPEN",
      description: "Builds things",
      responsibilities: "Writes code",
      openPositions: 3,
      sharePointLink: "https://example.com/role/1",
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
      link: "https://example.com/role/1",
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

describe("POST /api/job-roles", () => {
  it("returns 201 with created role dto for a valid payload", async () => {
    const response = await request(app).post("/api/job-roles").send({
      roleName: "Data Engineer",
      location: "Warsaw",
      bandId: seededBandId,
      capabilityId: seededCapabilityId,
      description: "Builds data pipelines",
      responsibilities: "Designs ETL jobs",
      openPositions: 2,
      sharePointLink: "https://example.com/role/new",
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
      openPositions: 2,
      sharePointLink: "https://example.com/role/new",
      closingDate: "2026-11-30T00:00:00.000Z",
    });
    expect(typeof response.body.id).toBe("number");

    await prisma.jobRole.delete({ where: { id: response.body.id } });
  });

  it("returns 201 when nullable optional fields are null and openPositions is 0", async () => {
    const response = await request(app).post("/api/job-roles").send({
      roleName: "Platform Engineer",
      location: "Remote",
      bandId: seededBandId,
      capabilityId: seededCapabilityId,
      description: null,
      responsibilities: null,
      openPositions: 0,
      sharePointLink: null,
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
      openPositions: 0,
      sharePointLink: null,
      closingDate: null,
    });

    await prisma.jobRole.delete({ where: { id: response.body.id } });
  });

  it("returns 400 when a required field is missing", async () => {
    const response = await request(app).post("/api/job-roles").send({
      location: "Warsaw",
      bandId: seededBandId,
      capabilityId: seededCapabilityId,
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: "roleName",
      message: "Invalid input: expected string, received undefined",
    });
  });

  it("returns 201 and persists OPEN even when CLOSED is sent", async () => {
    const response = await request(app).post("/api/job-roles").send({
      roleName: "Integration Engineer",
      location: "Warsaw",
      status: "CLOSED",
      bandId: seededBandId,
      capabilityId: seededCapabilityId,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      roleName: "Integration Engineer",
      status: "OPEN",
      band: "Senior Associate",
      capability: "Engineering",
    });

    const created = await prisma.jobRole.findUnique({ where: { id: response.body.id } });
    expect(created?.status).toBe("OPEN");

    await prisma.jobRole.delete({ where: { id: response.body.id } });
  });

  it("returns 400 when closingDate is not a valid datetime", async () => {
    const response = await request(app).post("/api/job-roles").send({
      roleName: "QA Engineer",
      location: "Krakow",
      bandId: seededBandId,
      capabilityId: seededCapabilityId,
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

    const response = await request(app).post("/api/job-roles").send({
      roleName: "Data Engineer",
      location: "Warsaw",
      bandId: seededBandId,
      capabilityId: seededCapabilityId,
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Insert failed" });
  });
});

describe("PUT /api/job-roles/:id", () => {
  let editableJobRoleId: number;

  const validBody = {
    jobRoleName: "Lead Software Engineer",
    location: "Belfast",
    status: "CLOSED",
    bandName: "Consultant",
    capabilityName: "Testing",
    description: "Leads delivery teams.",
    responsibilities: "Owns technical direction.",
    sharePointLink: "https://example.com/role/updated",
    openPositions: 7,
    closingDate: "2027-01-31T23:59:59.000Z",
  };

  // osobny rekord, zeby PUT nie modyfikowal roli uzywanej przez testy GET
  beforeAll(async () => {
    await prisma.band.create({ data: { name: "Consultant" } });
    await prisma.capability.create({ data: { name: "Testing" } });

    const band = await prisma.band.findUniqueOrThrow({ where: { name: "Senior Associate" } });
    const capability = await prisma.capability.findUniqueOrThrow({
      where: { name: "Engineering" },
    });
    const jobRole = await prisma.jobRole.create({
      data: {
        roleName: "Editable Role",
        location: "Gdansk",
        status: "OPEN",
        description: "Before update",
        responsibilities: "Before update",
        openPositions: 1,
        sharePointLink: "https://example.com/role/before",
        bandId: band.id,
        capabilityId: capability.id,
      },
    });

    editableJobRoleId = jobRole.id;
  });

  it("returns 200 with the updated dto and persists the change", async () => {
    const response = await request(app).put(`/api/job-roles/${editableJobRoleId}`).send(validBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: editableJobRoleId,
      jobRoleName: "Lead Software Engineer",
      description: "Leads delivery teams.",
      responsibilities: "Owns technical direction.",
      link: "https://example.com/role/updated",
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
      .put(`/api/job-roles/${editableJobRoleId}`)
      .send({
        ...validBody,
        description: null,
        responsibilities: null,
        sharePointLink: null,
        openPositions: null,
        closingDate: null,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      description: null,
      link: null,
      closingDate: null,
    });
  });

  it("returns 404 when the job role does not exist", async () => {
    const response = await request(app).put("/api/job-roles/9999").send(validBody);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Job role not found" });
  });

  it("returns 400 when the id is not a positive integer", async () => {
    const response = await request(app).put("/api/job-roles/abc").send(validBody);

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: "id", message: "Id must be a positive integer" },
    ]);
  });

  it("returns 400 when a required field is missing", async () => {
    const { location, ...bodyWithoutLocation } = validBody;

    const response = await request(app)
      .put(`/api/job-roles/${editableJobRoleId}`)
      .send(bodyWithoutLocation);

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(expect.objectContaining({ field: "location" }));
  });

  it("returns 400 when the status is outside the enum", async () => {
    const response = await request(app)
      .put(`/api/job-roles/${editableJobRoleId}`)
      .send({ ...validBody, status: "PENDING" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(expect.objectContaining({ field: "status" }));
  });

  it("returns 400 when an unknown field is sent", async () => {
    const response = await request(app)
      .put(`/api/job-roles/${editableJobRoleId}`)
      .send({ ...validBody, id: 99 });

    expect(response.status).toBe(400);
  });

  it("returns 400 when sharePointLink is not a url", async () => {
    const response = await request(app)
      .put(`/api/job-roles/${editableJobRoleId}`)
      .send({ ...validBody, sharePointLink: "not-a-url" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: "sharePointLink" }),
    );
  });

  it("returns 400 when openPositions is negative", async () => {
    const response = await request(app)
      .put(`/api/job-roles/${editableJobRoleId}`)
      .send({ ...validBody, openPositions: -1 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: "openPositions" }),
    );
  });

  it("returns 400 when the band name does not exist", async () => {
    const response = await request(app)
      .put(`/api/job-roles/${editableJobRoleId}`)
      .send({ ...validBody, bandName: "Nonexistent Band" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(expect.objectContaining({ field: "bandName" }));
  });

  it("returns 400 when the capability name does not exist", async () => {
    const response = await request(app)
      .put(`/api/job-roles/${editableJobRoleId}`)
      .send({ ...validBody, capabilityName: "Nonexistent Capability" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: "capabilityName" }),
    );
  });
});
