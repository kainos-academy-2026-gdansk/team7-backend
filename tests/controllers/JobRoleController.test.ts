import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRoleDetailedDTO } from "../../src/Dto/JobRoleDTO";
import { JobRoleController } from "../../src/controllers/JobRoleController";
import type { JobRoleDetailed } from "../../src/models/JobRole";
import type { JobRoleService } from "../../src/services/JobRoleService";

const findAll = vi.fn();
const getJobRoleById = vi.fn();

const jobRoleServiceMock = {
  findAll,
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
  status: "OPEN",
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
  status: "OPEN",
  numberOfOpenPositions: 3,
};

const jobRoleListMock = [
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
    closingDate: null,
    band: { name: "Associate" },
    capability: { name: "Engineering" },
  },
];

const jobRoleListDtoMock = [
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
    closingDate: null,
  },
];

describe("JobRoleController", () => {
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

  describe("getJobRoleById", () => {
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
      expect(status).not.toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("responds with 200 and the mapped list", async () => {
      findAll.mockResolvedValue(jobRoleListMock);

      await jobRoleController.getAll(req, res, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(jobRoleListDtoMock);
    });

    it("responds with an empty list when there are no job roles", async () => {
      findAll.mockResolvedValue([]);

      await jobRoleController.getAll(req, res, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith([]);
    });

    it("forwards errors to next when the service throws", async () => {
      const error = new Error("Database connection failed");
      findAll.mockRejectedValue(error);

      await jobRoleController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(status).not.toHaveBeenCalled();
    });
  });
});
