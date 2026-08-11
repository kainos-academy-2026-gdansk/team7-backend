import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BandService } from "../../src/services/BandService";

const findMany = vi.fn();

const dbMock = {
  band: { findMany },
} as unknown as PrismaClient;

describe("BandService", () => {
  let bandService: BandService;

  beforeEach(() => {
    vi.resetAllMocks();
    bandService = new BandService(dbMock);
  });

  describe("findAll", () => {
    it("returns all bands", async () => {
      findMany.mockResolvedValue([
        { id: 1, name: "Apprentice" },
        { id: 2, name: "Trainee" },
      ]);

      const result = await bandService.findAll();

      expect(result).toEqual([
        { id: 1, name: "Apprentice" },
        { id: 2, name: "Trainee" },
      ]);
      expect(findMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
        orderBy: { id: "asc" },
      });
    });

    it("rejects when prisma query fails", async () => {
      findMany.mockRejectedValue(new Error("bands query failed"));

      await expect(bandService.findAll()).rejects.toThrow("bands query failed");
    });
  });
});
