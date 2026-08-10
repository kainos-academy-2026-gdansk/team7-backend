import type { Prisma, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRoleDetailed } from "../../src/models/JobRole";
import { JobRoleService } from "../../src/services/JobRoleService";

const findUnique = vi.fn();
const findMany = vi.fn();

const dbMock = {
  jobRole: { findUnique, findMany },
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
});
