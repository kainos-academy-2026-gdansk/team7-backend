import type { Prisma, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AddJobRoleDto } from "../../src/Dto/JobRoleDTO";
import type { JobRoleDetailed } from "../../src/models/JobRole";
import { JobRoleService } from "../../src/services/JobRoleService";

const findUnique = vi.fn();
const findMany = vi.fn();
const create = vi.fn();
const bandFindMany = vi.fn();
const capabilityFindMany = vi.fn();

const dbMock = {
  jobRole: { findUnique, findMany, create },
  band: { findMany: bandFindMany },
  capability: { findMany: capabilityFindMany },
} as unknown as PrismaClient;

type JobRoleWithRelations = Prisma.JobRoleGetPayload<{
  include: { band: true; capability: true };
}>;

const jobRoleRecordMock: JobRoleWithRelations = {
  id: 1,
  roleName: "Software Engineer",
  location: "Gdansk",
  closingDate: new Date("2026-12-31T00:00:00.000Z"),
  status: "OPEN",
  description: "Builds things",
  responsibilities: "Writes code",
  openPositions: 3,
  sharePointLink: "https://example.com/role/1",
  bandId: 2,
  capabilityId: 5,
  band: { id: 2, name: "Senior Associate" },
  capability: { id: 5, name: "Engineering" },
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

const jobRoleDetailedMock: JobRoleDetailed = {
  id: 1,
  jobRoleName: "Software Engineer",
  description: "Builds things",
  responsibilities: "Writes code",
  link: "https://example.com/role/1",
  location: "Gdansk",
  capability: { id: 5, name: "Engineering" },
  band: { id: 2, name: "Senior Associate" },
  closingDate: new Date("2026-12-31T00:00:00.000Z"),
  status: "OPEN",
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
  status: "OPEN",
  bandId: 2,
  capabilityId: 5,
  description: "Builds data pipelines",
  responsibilities: "Designs ETL jobs",
  openPositions: 2,
  sharePointLink: "https://example.com/role/2",
  closingDate: new Date("2026-11-30T00:00:00.000Z"),
};

const createdJobRoleRecordMock: JobRoleWithRelations = {
  id: 2,
  roleName: "Data Engineer",
  location: "Warsaw",
  closingDate: new Date("2026-11-30T00:00:00.000Z"),
  status: "OPEN",
  description: "Builds data pipelines",
  responsibilities: "Designs ETL jobs",
  openPositions: 2,
  sharePointLink: "https://example.com/role/2",
  bandId: 2,
  capabilityId: 5,
  band: { id: 2, name: "Senior Associate" },
  capability: { id: 5, name: "Engineering" },
  createdAt: new Date("2026-01-03T00:00:00.000Z"),
  updatedAt: new Date("2026-01-03T00:00:00.000Z"),
};

const bandsMock = [
  { id: 1, name: "Apprentice" },
  { id: 2, name: "Trainee" },
];

const capabilitiesMock = [
  { id: 1, name: "Innovation" },
  { id: 2, name: "Engineering" },
];

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
        include: { band: true, capability: true },
      });
    });

    it("falls back to defaults when optional fields are null", async () => {
      findUnique.mockResolvedValue({
        ...jobRoleRecordMock,
        responsibilities: null,
        openPositions: null,
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
    it("creates a job role and returns it with relations", async () => {
      create.mockResolvedValue(createdJobRoleRecordMock);

      const result = await jobRoleService.createJobRole(addJobRoleDtoMock);

      expect(result).toEqual(createdJobRoleRecordMock);
    });

    it("calls prisma create with mapped input and included relations", async () => {
      create.mockResolvedValue(createdJobRoleRecordMock);

      await jobRoleService.createJobRole(addJobRoleDtoMock);

      expect(create).toHaveBeenCalledWith({
        data: {
          roleName: "Data Engineer",
          location: "Warsaw",
          closingDate: new Date("2026-11-30T00:00:00.000Z"),
          status: "OPEN",
          description: "Builds data pipelines",
          responsibilities: "Designs ETL jobs",
          openPositions: 2,
          sharePointLink: "https://example.com/role/2",
          bandId: 2,
          capabilityId: 5,
        },
        include: {
          band: true,
          capability: true,
        },
      });
    });

    it("persists OPEN status even when payload status is CLOSED", async () => {
      create.mockResolvedValue({
        ...createdJobRoleRecordMock,
        status: "OPEN",
      });

      await jobRoleService.createJobRole({
        ...addJobRoleDtoMock,
        status: "CLOSED",
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "OPEN",
          }),
        }),
      );
    });

    it("passes null/undefined optional fields through to prisma", async () => {
      create.mockResolvedValue({
        ...createdJobRoleRecordMock,
        id: 3,
        description: null,
        responsibilities: null,
        openPositions: null,
        sharePointLink: null,
        closingDate: null,
      });

      await jobRoleService.createJobRole({
        roleName: "Platform Engineer",
        location: "Remote",
        status: "OPEN",
        bandId: 2,
        capabilityId: 5,
        description: null,
        responsibilities: null,
        openPositions: null,
        sharePointLink: null,
        closingDate: null,
      });

      expect(create).toHaveBeenCalledWith({
        data: {
          roleName: "Platform Engineer",
          location: "Remote",
          closingDate: null,
          status: "OPEN",
          description: null,
          responsibilities: null,
          openPositions: null,
          sharePointLink: null,
          bandId: 2,
          capabilityId: 5,
        },
        include: {
          band: true,
          capability: true,
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

  describe("findAllBands", () => {
    it("returns all bands", async () => {
      bandFindMany.mockResolvedValue(bandsMock);

      const result = await jobRoleService.findAllBands();

      expect(result).toEqual(bandsMock);
      expect(bandFindMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
        orderBy: { id: "asc" },
      });
    });

    it("rejects when prisma band query fails", async () => {
      bandFindMany.mockRejectedValue(new Error("bands query failed"));

      await expect(jobRoleService.findAllBands()).rejects.toThrow("bands query failed");
    });
  });

  describe("findAllCapabilities", () => {
    it("returns all capabilities", async () => {
      capabilityFindMany.mockResolvedValue(capabilitiesMock);

      const result = await jobRoleService.findAllCapabilities();

      expect(result).toEqual(capabilitiesMock);
      expect(capabilityFindMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
        orderBy: { id: "asc" },
      });
    });

    it("rejects when prisma capability query fails", async () => {
      capabilityFindMany.mockRejectedValue(new Error("capabilities query failed"));

      await expect(jobRoleService.findAllCapabilities()).rejects.toThrow(
        "capabilities query failed",
      );
    });
  });
});
