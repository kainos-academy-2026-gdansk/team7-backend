import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRoleController } from "../../src/controllers/JobRoleController";
import type { JobRoleDetailedDTO } from "../../src/dto/JobRoleDTO";
import { type JobRoleDetailed, JobRoleStatus } from "../../src/models/JobRole";
import type JobRoleService from "../../src/services/JobRoleService";

const getJobRoleById = vi.fn();

const jobRoleServiceMock = {
  getJobRoleById,
} as unknown as JobRoleService;

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

const jobRoleDetailedDtoMock: JobRoleDetailedDTO = {
  id: 1,
  jobRoleName: "Software Engineer",
  description: "Builds things",
  responsibilities: "Writes code",
  link: "https://example.com/role/1",
  location: "Gdansk",
  capability: "Engineering",
  band: "Senior Associate",
  closingDate: new Date("2026-12-31T00:00:00.000Z"),
  status: JobRoleStatus.OPEN,
  numberOfOpenPositions: 3,
};

describe("JobRoleController.getJobRoleById", () => {
  let jobRoleController: JobRoleController;
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let status: ReturnType<typeof vi.fn>;
  let json: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    json = vi.fn();
    status = vi.fn(() => ({ json }));
    req = { params: { id: "1" } } as unknown as Request;
    res = { status, json } as unknown as Response;
    next = vi.fn();

    jobRoleController = new JobRoleController(jobRoleServiceMock);
  });

  it("responds with 200 and the mapped dto when the job role exists", async () => {
    getJobRoleById.mockResolvedValue(jobRoleDetailedMock);

    await jobRoleController.getJobRoleById(req, res, next);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(jobRoleDetailedDtoMock);
  });

  it("responds with 404 when the service returns null", async () => {
    getJobRoleById.mockResolvedValue(null);

    await jobRoleController.getJobRoleById(req, res, next);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: "Job role not found" });
  });

  it("calls the service with the id parsed from the route params", async () => {
    await jobRoleController.getJobRoleById(req, res, next);

    expect(getJobRoleById).toHaveBeenCalledWith(1);
  });

  it("forwards errors to next when the service throws", async () => {
    const error = new Error("Service error");
    getJobRoleById.mockRejectedValue(error);

    await jobRoleController.getJobRoleById(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
