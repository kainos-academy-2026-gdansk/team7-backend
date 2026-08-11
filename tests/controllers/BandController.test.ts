import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BandController } from "../../src/controllers/BandController";
import type { BandService } from "../../src/services/BandService";

const findAll = vi.fn();

const bandServiceMock = {
  findAll,
} as unknown as BandService;

describe("BandController", () => {
  let bandController: BandController;
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

    bandController = new BandController(bandServiceMock);
  });

  describe("getAll", () => {
    it("responds with 200 and all bands", async () => {
      findAll.mockResolvedValue([
        { id: 1, name: "Apprentice" },
        { id: 2, name: "Trainee" },
      ]);

      await bandController.getAll(req, res, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith([
        { id: 1, name: "Apprentice" },
        { id: 2, name: "Trainee" },
      ]);
    });

    it("forwards errors to next when the service throws", async () => {
      const error = new Error("bands query failed");
      findAll.mockRejectedValue(error);

      await bandController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(status).not.toHaveBeenCalled();
    });
  });
});
