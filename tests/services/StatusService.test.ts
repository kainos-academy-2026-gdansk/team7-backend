import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusService } from "../../src/services/StatusService";

const findMany = vi.fn();

const dbMock = {
  status: { findMany },
} as unknown as PrismaClient;

describe("StatusService", () => {
  let statusService: StatusService;

  beforeEach(() => {
    vi.resetAllMocks();
    statusService = new StatusService(dbMock);
  });

  describe("findAll", () => {
    it("returns all statuses", async () => {
      findMany.mockResolvedValue([
        { statusId: 1, statusName: "OPEN" },
        { statusId: 2, statusName: "CLOSED" },
      ]);

      const result = await statusService.findAll();

      expect(result).toEqual([
        { statusId: 1, statusName: "OPEN" },
        { statusId: 2, statusName: "CLOSED" },
      ]);
    });

    it("selects only the id and name, ordered by id", async () => {
      findMany.mockResolvedValue([]);

      await statusService.findAll();

      expect(findMany).toHaveBeenCalledWith({
        select: { statusId: true, statusName: true },
        orderBy: { statusId: "asc" },
      });
    });

    it("rejects when the query fails", async () => {
      findMany.mockRejectedValue(new Error("db down"));

      await expect(statusService.findAll()).rejects.toThrow("db down");
    });
  });
});
