import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CapabilityService } from "../../src/services/CapabilityService";

const findMany = vi.fn();

const dbMock = {
  capability: { findMany },
} as unknown as PrismaClient;

describe("CapabilityService", () => {
  let capabilityService: CapabilityService;

  beforeEach(() => {
    vi.resetAllMocks();
    capabilityService = new CapabilityService(dbMock);
  });

  describe("findAll", () => {
    it("returns all capabilities", async () => {
      findMany.mockResolvedValue([
        { id: 1, name: "Innovation" },
        { id: 2, name: "Engineering" },
      ]);

      const result = await capabilityService.findAll();

      expect(result).toEqual([
        { id: 1, name: "Innovation" },
        { id: 2, name: "Engineering" },
      ]);
      expect(findMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
        orderBy: { id: "asc" },
      });
    });

    it("rejects when prisma query fails", async () => {
      findMany.mockRejectedValue(new Error("capabilities query failed"));

      await expect(capabilityService.findAll()).rejects.toThrow("capabilities query failed");
    });
  });
});
