import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "../../src/prismaClient";
import { JobRoleService } from "../../src/services/JobRoleService";

vi.mock("../../src/prismaClient", () => ({
  default: {
    jobRole: {
      findMany: vi.fn(),
    },
  },
}));

describe("JobRoleService.findAll", () => {
  let service: JobRoleService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new JobRoleService(prisma as PrismaClient);
  });

  it("should return mapped list of job roles", async () => {
    const rows = [
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
        closingDate: new Date("2026-08-31T00:00:00.000Z"),
        band: { name: "Associate" },
        capability: { name: "Engineering" },
      },
    ];
    vi.mocked(prisma.jobRole.findMany).mockResolvedValue(rows as any);

    const result = await service.findAll();

    expect(prisma.jobRole.findMany).toHaveBeenCalledTimes(1);

    expect(result).toEqual([
      {
        roleName: "Front-End Engineer",
        location: "Gdansk",
        capability: "Engineering",
        band: "Associate",
        closingDate: "2026-08-31T00:00:00.000Z",
      },
      {
        roleName: "Back-End Engineer",
        location: "Gdansk",
        capability: "Engineering",
        band: "Associate",
        closingDate: "2026-08-31T00:00:00.000Z",
      },
    ]);
  });

  it("should return empty list when prisma returns no rows", async () => {
    vi.mocked(prisma.jobRole.findMany).mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });

  it("should reject when prisma findMany fails", async () => {
    vi.mocked(prisma.jobRole.findMany).mockRejectedValue(new Error("db down"));

    await expect(service.findAll()).rejects.toThrow("db down");
  });
});
