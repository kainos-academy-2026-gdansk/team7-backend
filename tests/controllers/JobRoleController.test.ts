import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRoleController } from "../../src/controllers/JobRoleController";
import Logger from "../../src/lib/logger";
import type { JobRoleService } from "../../src/services/JobRoleService";

vi.mock("../../src/lib/logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

const MockService = {
  findAll: vi.fn(),
} as unknown as JobRoleService;

const mockReq = {
  params: {},
  body: {},
} as unknown as Request;

const mockRes = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
} as unknown as Response;

describe("JobRoleController - getAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with mapped roles on success", async () => {
    const mockRoles = [
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
    ];

    MockService.findAll = vi.fn().mockResolvedValue(mockRoles);
    const controller = new JobRoleController(MockService);

    await controller.getAll(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockRoles);
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it("should return 500 when service throws an error", async () => {
    const error = new Error("Database connection failed");
    MockService.findAll = vi.fn().mockRejectedValue(error);
    const controller = new JobRoleController(MockService);

    await controller.getAll(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
    expect(Logger.error).toHaveBeenCalledWith(error);
  });

  it("should return empty list when service returns no roles", async () => {
    MockService.findAll = vi.fn().mockResolvedValue([]);
    const controller = new JobRoleController(MockService);

    await controller.getAll(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([]);
  });
});
