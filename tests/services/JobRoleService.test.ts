import type { Prisma, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import type { AddJobRoleDto, UpdateJobRoleRequestDTO } from "../../src/Dto/JobRoleDTO";
import type { JobRoleDetailed } from "../../src/models/JobRole";
import { JobRoleService } from "../../src/services/JobRoleService";

const findUnique = vi.fn();
const findMany = vi.fn();
const create = vi.fn();
const update = vi.fn();
const deleteJobRoleMock = vi.fn();
const bandFindUnique = vi.fn();
const capabilityFindUnique = vi.fn();
const statusFindUnique = vi.fn();

const dbMock = {
  jobRole: { findUnique, findMany, create, update, delete: deleteJobRoleMock },
  band: { findUnique: bandFindUnique },
  capability: { findUnique: capabilityFindUnique },
  status: { findUnique: statusFindUnique },
} as unknown as PrismaClient;

type JobRoleWithRelations = Prisma.JobRoleGetPayload<{
  include: { band: true; capability: true; status: true };
}>;

const jobRoleRecordMock: JobRoleWithRelations = {
  id: 1,
  roleName: "Software Engineer",
  location: "Gdansk",
  closingDate: new Date("2026-12-31T00:00:00.000Z"),
  statusId: 1,
  description: "Builds things",
  responsibilities: "Writes code",
  numberOfOpenPositions: 3,
  sharepointUrl: "https://example.com/role/1",
  bandId: 2,
  capabilityId: 5,
  band: { id: 2, name: "Senior Associate" },
  capability: { id: 5, name: "Engineering" },
  status: { statusId: 1, statusName: "OPEN" },
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

const jobRoleDetailedMock: JobRoleDetailed = {
  id: 1,
  jobRoleName: "Software Engineer",
  description: "Builds things",
  responsibilities: "Writes code",
  sharepointUrl: "https://example.com/role/1",
  location: "Gdansk",
  capability: { id: 5, name: "Engineering" },
  band: { id: 2, name: "Senior Associate" },
  closingDate: new Date("2026-12-31T00:00:00.000Z"),
  status: { statusId: 1, statusName: "OPEN" },
  numberOfOpenPositions: 3,
};

const jobRoleListMock = [
  {
    roleName: "Front-End Engineer",
    location: "Gdansk",
    closingDate: new Date("2026-08-31T00:00:00.000Z"),
    band: { name: "Associate" },
    capability: { name: "Engineering" },
  },
  {
    roleName: "Back-End Engineer",
    location: "Gdansk",
    closingDate: null,
    band: { name: "Associate" },
    capability: { name: "Engineering" },
  },
];

const addJobRoleDtoMock: AddJobRoleDto = {
  roleName: "Data Engineer",
  location: "Warsaw",
  bandId: 2,
  capabilityId: 5,
  description: "Builds data pipelines",
  responsibilities: "Designs ETL jobs",
  numberOfOpenPositions: 2,
  sharepointUrl: "https://example.com/role/2",
  closingDate: new Date("2026-11-30T00:00:00.000Z"),
};

const createdJobRoleRecordMock: JobRoleWithRelations = {
  id: 2,
  roleName: "Data Engineer",
  location: "Warsaw",
  closingDate: new Date("2026-11-30T00:00:00.000Z"),
  statusId: 1,
  description: "Builds data pipelines",
  responsibilities: "Designs ETL jobs",
  numberOfOpenPositions: 2,
  sharepointUrl: "https://example.com/role/2",
  bandId: 2,
  capabilityId: 5,
  band: { id: 2, name: "Senior Associate" },
  capability: { id: 5, name: "Engineering" },
  status: { statusId: 1, statusName: "OPEN" },
  createdAt: new Date("2026-01-03T00:00:00.000Z"),
  updatedAt: new Date("2026-01-03T00:00:00.000Z"),
};

const updateJobRoleDtoMock: UpdateJobRoleRequestDTO = {
  jobRoleName: "Software Engineer",
  location: "Gdansk",
  statusId: 1,
  bandName: "Senior Associate",
  capabilityName: "Engineering",
  description: "Builds things",
  responsibilities: "Writes code",
  sharepointUrl: "https://example.com/role/1",
  numberOfOpenPositions: 3,
  closingDate: "2026-12-31T00:00:00.000Z",
};

describe("JobRoleService", () => {
  let jobRoleService: JobRoleService;

  beforeEach(() => {
    vi.resetAllMocks();
    jobRoleService = new JobRoleService(dbMock);
  });

  describe("getJobRoleById", () => {
    it("returns the mapped job role when one is found", async () => {
      findUnique.mockResolvedValue(jobRoleRecordMock);

      const result = await jobRoleService.getJobRoleById(1);

      expect(result).toEqual(jobRoleDetailedMock);
    });

    it("returns null when no job role matches the id", async () => {
      findUnique.mockResolvedValue(null);

      const result = await jobRoleService.getJobRoleById(999);

      expect(result).toBeNull();
    });

    it("queries prisma by id including band and capability", async () => {
      findUnique.mockResolvedValue(jobRoleRecordMock);

      await jobRoleService.getJobRoleById(1);

      expect(findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { band: true, capability: true, status: true },
      });
    });

    it("falls back to defaults when optional fields are null", async () => {
      findUnique.mockResolvedValue({
        ...jobRoleRecordMock,
        responsibilities: null,
        numberOfOpenPositions: null,
      });

      const result = await jobRoleService.getJobRoleById(1);

      expect(result).toMatchObject({
        responsibilities: "",
        numberOfOpenPositions: 0,
      });
    });
  });

  describe("findAll", () => {
    it("returns the job role list from prisma", async () => {
      findMany.mockResolvedValue(jobRoleListMock);

      const result = await jobRoleService.findAll();

      expect(result).toEqual(jobRoleListMock);
      expect(findMany).toHaveBeenCalledTimes(1);
    });

    it("returns an empty list when prisma returns no rows", async () => {
      findMany.mockResolvedValue([]);

      const result = await jobRoleService.findAll();

      expect(result).toEqual([]);
    });

    it("rejects when prisma findMany fails", async () => {
      findMany.mockRejectedValue(new Error("db down"));

      await expect(jobRoleService.findAll()).rejects.toThrow("db down");
    });
  });

  describe("createJobRole", () => {
    beforeEach(() => {
      statusFindUnique.mockResolvedValue({ statusId: 1 });
    });

    it("creates a job role and returns it with relations", async () => {
      create.mockResolvedValue(createdJobRoleRecordMock);

      const result = await jobRoleService.createJobRole(addJobRoleDtoMock);

      expect(result).toEqual(createdJobRoleRecordMock);
    });

    it("resolves the default OPEN status before creating the job role", async () => {
      create.mockResolvedValue(createdJobRoleRecordMock);

      await jobRoleService.createJobRole(addJobRoleDtoMock);

      expect(statusFindUnique).toHaveBeenCalledWith({
        where: { statusName: "OPEN" },
        select: { statusId: true },
      });
    });

    it("rejects when the OPEN status is not configured", async () => {
      statusFindUnique.mockResolvedValue(null);

      await expect(jobRoleService.createJobRole(addJobRoleDtoMock)).rejects.toThrow(
        'Status "OPEN" is not configured',
      );
      expect(create).not.toHaveBeenCalled();
    });

    it("calls prisma create with mapped input and included relations", async () => {
      create.mockResolvedValue(createdJobRoleRecordMock);

      await jobRoleService.createJobRole(addJobRoleDtoMock);

      expect(create).toHaveBeenCalledWith({
        data: {
          roleName: "Data Engineer",
          location: "Warsaw",
          closingDate: new Date("2026-11-30T00:00:00.000Z"),
          statusId: 1,
          description: "Builds data pipelines",
          responsibilities: "Designs ETL jobs",
          numberOfOpenPositions: 2,
          sharepointUrl: "https://example.com/role/2",
          bandId: 2,
          capabilityId: 5,
        },
        include: {
          band: true,
          capability: true,
          status: true,
        },
      });
    });

    it("passes null/undefined optional fields through to prisma", async () => {
      create.mockResolvedValue({
        ...createdJobRoleRecordMock,
        id: 3,
        description: null,
        responsibilities: null,
        numberOfOpenPositions: null,
        sharepointUrl: null,
        closingDate: null,
      });

      await jobRoleService.createJobRole({
        roleName: "Platform Engineer",
        location: "Remote",
        bandId: 2,
        capabilityId: 5,
        description: null,
        responsibilities: null,
        numberOfOpenPositions: null,
        sharepointUrl: null,
        closingDate: null,
      });

      expect(create).toHaveBeenCalledWith({
        data: {
          roleName: "Platform Engineer",
          location: "Remote",
          closingDate: null,
          statusId: 1,
          description: null,
          responsibilities: null,
          numberOfOpenPositions: null,
          sharepointUrl: null,
          bandId: 2,
          capabilityId: 5,
        },
        include: {
          band: true,
          capability: true,
          status: true,
        },
      });
    });

    it("rejects when prisma create fails", async () => {
      create.mockRejectedValue(new Error("insert failed"));

      await expect(jobRoleService.createJobRole(addJobRoleDtoMock)).rejects.toThrow(
        "insert failed",
      );
    });
  });

  describe("updateJobRole", () => {
    beforeEach(() => {
      bandFindUnique.mockResolvedValue({ id: 2 });
      capabilityFindUnique.mockResolvedValue({ id: 5 });
      statusFindUnique.mockResolvedValue({ statusId: 1 });
    });

    it("returns the mapped job role when the update succeeds", async () => {
      findUnique.mockResolvedValue({ id: 1 });
      update.mockResolvedValue(jobRoleRecordMock);

      const result = await jobRoleService.updateJobRole(1, updateJobRoleDtoMock);

      expect(result).toEqual(jobRoleDetailedMock);
    });

    it("returns null and skips the update when the job role does not exist", async () => {
      findUnique.mockResolvedValue(null);

      const result = await jobRoleService.updateJobRole(999, updateJobRoleDtoMock);

      expect(result).toBeNull();
      expect(update).not.toHaveBeenCalled();
    });

    it("maps the dto onto prisma columns and connects relations by name", async () => {
      findUnique.mockResolvedValue({ id: 1 });
      update.mockResolvedValue(jobRoleRecordMock);

      await jobRoleService.updateJobRole(1, updateJobRoleDtoMock);

      expect(update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          roleName: "Software Engineer",
          location: "Gdansk",
          description: "Builds things",
          responsibilities: "Writes code",
          sharepointUrl: "https://example.com/role/1",
          numberOfOpenPositions: 3,
          closingDate: "2026-12-31T00:00:00.000Z",
          status: { connect: { statusId: 1 } },
          band: { connect: { name: "Senior Associate" } },
          capability: { connect: { name: "Engineering" } },
        },
        include: { band: true, capability: true, status: true },
      });
    });

    it("writes nulls when nullable fields are cleared", async () => {
      findUnique.mockResolvedValue({ id: 1 });
      update.mockResolvedValue(jobRoleRecordMock);

      await jobRoleService.updateJobRole(1, {
        ...updateJobRoleDtoMock,
        description: null,
        responsibilities: null,
        sharepointUrl: null,
        numberOfOpenPositions: null,
        closingDate: null,
      });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: null,
            responsibilities: null,
            sharepointUrl: null,
            numberOfOpenPositions: null,
            closingDate: null,
          }),
        }),
      );
    });

    it("falls back to defaults when the updated row has null optional fields", async () => {
      findUnique.mockResolvedValue({ id: 1 });
      update.mockResolvedValue({
        ...jobRoleRecordMock,
        responsibilities: null,
        numberOfOpenPositions: null,
      });

      const result = await jobRoleService.updateJobRole(1, updateJobRoleDtoMock);

      expect(result).toMatchObject({
        responsibilities: "",
        numberOfOpenPositions: 0,
      });
    });

    it("rejects when prisma update fails", async () => {
      findUnique.mockResolvedValue({ id: 1 });
      update.mockRejectedValue(new Error("db down"));

      await expect(jobRoleService.updateJobRole(1, updateJobRoleDtoMock)).rejects.toThrow(
        "db down",
      );
    });

    it("throws a ZodError with per-field issues when the relations do not exist", async () => {
      findUnique.mockResolvedValue({ id: 1 });
      bandFindUnique.mockResolvedValue(null);
      capabilityFindUnique.mockResolvedValue(null);
      statusFindUnique.mockResolvedValue(null);

      const error = await jobRoleService.updateJobRole(1, updateJobRoleDtoMock).catch((e) => e);

      expect(error).toBeInstanceOf(ZodError);
      expect(error.issues.map((issue: { path: PropertyKey[] }) => issue.path)).toEqual([
        ["bandName"],
        ["capabilityName"],
        ["statusId"],
      ]);
      expect(update).not.toHaveBeenCalled();
    });

    it("throws a ZodError for statusId when only the status is missing", async () => {
      findUnique.mockResolvedValue({ id: 1 });
      statusFindUnique.mockResolvedValue(null);

      const error = await jobRoleService.updateJobRole(1, updateJobRoleDtoMock).catch((e) => e);

      expect(error).toBeInstanceOf(ZodError);
      expect(error.issues.map((issue: { path: PropertyKey[] }) => issue.path)).toEqual([
        ["statusId"],
      ]);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe("deleteJobRole", () => {
    it("deletes the job role and returns true when it exists", async () => {
      findUnique.mockResolvedValue(jobRoleRecordMock);
      deleteJobRoleMock.mockResolvedValue(jobRoleRecordMock);

      const result = await jobRoleService.deleteJobRole(1);

      expect(result).toBe(true);
      expect(deleteJobRoleMock).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("returns false and does not delete when the job role does not exist", async () => {
      findUnique.mockResolvedValue(null);

      const result = await jobRoleService.deleteJobRole(999);

      expect(result).toBe(false);
      expect(deleteJobRoleMock).not.toHaveBeenCalled();
    });

    it("rejects when prisma delete fails", async () => {
      findUnique.mockResolvedValue(jobRoleRecordMock);
      deleteJobRoleMock.mockRejectedValue(new Error("db down"));

      await expect(jobRoleService.deleteJobRole(1)).rejects.toThrow("db down");
    });
  });
});
