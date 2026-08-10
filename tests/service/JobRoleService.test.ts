import type { Prisma, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type JobRoleDetailed, JobRoleStatus } from "../../src/models/JobRole";
import JobRoleService from "../../src/services/JobRoleService";
const findUnique = vi.fn();

const dbMock = {
  jobRole: { findUnique },
} as unknown as PrismaClient;

type JobRoleWithRelations = Prisma.JobRoleGetPayload<{
  include: { band: true; capability: true };
}>;

const jobRoleRecordMock: JobRoleWithRelations = {
  id: 1,
  roleName: "Software Engineer",
  location: "Gdansk",
  closingDate: new Date("2026-12-31T00:00:00.000Z"),
  status: JobRoleStatus.OPEN,
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
  status: JobRoleStatus.OPEN,
  numberOfOpenPositions: 3,
};

describe("JobRoleService.getJobRoleById", () => {
  let jobRoleService: JobRoleService;

  beforeEach(() => {
    vi.resetAllMocks();
    jobRoleService = new JobRoleService(dbMock);
  });

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
