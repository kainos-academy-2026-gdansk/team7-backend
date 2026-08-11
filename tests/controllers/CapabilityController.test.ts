import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CapabilityController } from "../../src/controllers/CapabilityController";
import type { CapabilityService } from "../../src/services/CapabilityService";

const findAll = vi.fn();

const capabilityServiceMock = {
  findAll,
} as unknown as CapabilityService;

describe("CapabilityController", () => {
  let capabilityController: CapabilityController;
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

    capabilityController = new CapabilityController(capabilityServiceMock);
  });

  describe("getAll", () => {
    it("responds with 200 and all capabilities", async () => {
      findAll.mockResolvedValue([
        { id: 1, name: "Innovation" },
        { id: 2, name: "Engineering" },
      ]);

      await capabilityController.getAll(req, res, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith([
        { id: 1, name: "Innovation" },
        { id: 2, name: "Engineering" },
      ]);
    });

    it("forwards errors to next when the service throws", async () => {
      const error = new Error("capabilities query failed");
      findAll.mockRejectedValue(error);

      await capabilityController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(status).not.toHaveBeenCalled();
    });
  });
});
