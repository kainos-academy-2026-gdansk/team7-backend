import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusController } from "../../src/controllers/StatusController";
import type { StatusService } from "../../src/services/StatusService";

const findAll = vi.fn();

const statusServiceMock = {
  findAll,
} as unknown as StatusService;

describe("StatusController", () => {
  let statusController: StatusController;
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let status: ReturnType<typeof vi.fn>;
  let json: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    json = vi.fn();
    status = vi.fn(() => ({ json }));
    req = {} as Request;
    res = { status, json } as unknown as Response;
    next = vi.fn();

    statusController = new StatusController(statusServiceMock);
  });

  describe("getAll", () => {
    it("responds with 200 and all statuses", async () => {
      findAll.mockResolvedValue([
        { statusId: 1, statusName: "OPEN" },
        { statusId: 2, statusName: "CLOSED" },
      ]);

      await statusController.getAll(req, res, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith([
        { statusId: 1, statusName: "OPEN" },
        { statusId: 2, statusName: "CLOSED" },
      ]);
    });

    it("forwards errors to next when the service throws", async () => {
      const error = new Error("statuses query failed");
      findAll.mockRejectedValue(error);

      await statusController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(status).not.toHaveBeenCalled();
    });
  });
});
