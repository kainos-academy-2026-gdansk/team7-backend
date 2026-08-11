import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AddJobRoleResponseDto,
  JobRoleDetailedDTO,
  UpdateJobRoleRequestDTO,
} from "../../src/Dto/JobRoleDTO";
import { JobRoleController } from "../../src/controllers/JobRoleController";
import type { JobRoleDetailed } from "../../src/models/JobRole";
import type { JobRoleWithRelations } from "../../src/models/JobRole";
import type { JobRoleService } from "../../src/services/JobRoleService";

const findAll = vi.fn();
const getJobRoleById = vi.fn();
const createJobRole = vi.fn();
const updateJobRole = vi.fn();
const deleteJobRole = vi.fn();

const jobRoleServiceMock = {
  findAll,
  getJobRoleById,
  createJobRole,
  updateJobRole,
  deleteJobRole,
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
  closingDate: "2026-12-31T00:00:00.000Z",
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

const createdJobRoleRecordMock: JobRoleWithRelations = {
  id: 10,
  roleName: "Data Engineer",
  location: "Warsaw",
  closingDate: new Date("2026-11-30T00:00:00.000Z"),
  status: "OPEN",
  description: "Builds data pipelines",
  responsibilities: "Designs ETL jobs",
  openPositions: 2,
  sharePointLink: "https://example.com/role/10",
  bandId: 2,
  capabilityId: 5,
  band: { id: 2, name: "Senior Associate" },
  capability: { id: 5, name: "Engineering" },
  createdAt: new Date("2026-01-03T00:00:00.000Z"),
  updatedAt: new Date("2026-01-03T00:00:00.000Z"),
};

const addJobRoleResponseDtoMock: AddJobRoleResponseDto = {
  id: 10,
  roleName: "Data Engineer",
  location: "Warsaw",
  status: "OPEN",
  band: "Senior Associate",
  capability: "Engineering",
  description: "Builds data pipelines",
  responsibilities: "Designs ETL jobs",
  openPositions: 2,
  sharePointLink: "https://example.com/role/10",
  closingDate: "2026-11-30T00:00:00.000Z",
};

const updateJobRoleDtoMock: UpdateJobRoleRequestDTO = {
  jobRoleName: "Software Engineer",
  location: "Gdansk",
  status: "OPEN",
  bandName: "Senior Associate",
  capabilityName: "Engineering",
  description: "Builds things",
  responsibilities: "Writes code",
  sharePointLink: "https://example.com/role/1",
  openPositions: 3,
  closingDate: "2026-12-31T00:00:00.000Z",
};

describe("JobRoleController", () => {
  let jobRoleController: JobRoleController;
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let status: ReturnType<typeof vi.fn>;
  let json: ReturnType<typeof vi.fn>;
  let send: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    json = vi.fn();
    send = vi.fn();
    status = vi.fn(() => ({ json, send }));
    req = { params: { id: "1" } } as unknown as Request;
    res = { status, json, send } as unknown as Response;
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

  describe("addJobRole", () => {
    it("responds with 201 and created job role dto", async () => {
      req = {
        body: {
          roleName: "Data Engineer",
          location: "Warsaw",
          bandId: 2,
          capabilityId: 5,
          description: "Builds data pipelines",
          responsibilities: "Designs ETL jobs",
          openPositions: 2,
          sharePointLink: "https://example.com/role/10",
          closingDate: new Date("2026-11-30T00:00:00.000Z"),
        },
      } as unknown as Request;
      createJobRole.mockResolvedValue(createdJobRoleRecordMock);

      await jobRoleController.addJobRole(req, res, next);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith(addJobRoleResponseDtoMock);
    });

    it("calls service with request body", async () => {
      req = {
        body: {
          roleName: "Data Engineer",
          location: "Warsaw",
          bandId: 2,
          capabilityId: 5,
          description: null,
          responsibilities: null,
          openPositions: 0,
          sharePointLink: null,
          closingDate: null,
        },
      } as unknown as Request;
      createJobRole.mockResolvedValue({
        ...createdJobRoleRecordMock,
        description: null,
        responsibilities: null,
        openPositions: 0,
        sharePointLink: null,
        closingDate: null,
      });

      await jobRoleController.addJobRole(req, res, next);

      expect(createJobRole).toHaveBeenCalledWith(req.body);
    });

    it("forwards errors to next when service throws", async () => {
      const error = new Error("insert failed");
      createJobRole.mockRejectedValue(error);

      await jobRoleController.addJobRole(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(status).not.toHaveBeenCalled();
    });
  });

  describe("updateJobRole", () => {
    beforeEach(() => {
      req = { params: { id: "1" }, body: updateJobRoleDtoMock } as unknown as Request;
    });

    it("responds with 200 and the mapped dto when the update succeeds", async () => {
      updateJobRole.mockResolvedValue(jobRoleDetailedMock);

      await jobRoleController.updateJobRole(req, res, next);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(jobRoleDetailedDtoMock);
    });

    it("calls the service with the parsed id and the validated body", async () => {
      updateJobRole.mockResolvedValue(jobRoleDetailedMock);

      await jobRoleController.updateJobRole(req, res, next);

      expect(updateJobRole).toHaveBeenCalledWith(1, updateJobRoleDtoMock);
    });

    it("passes nullable fields through as null", async () => {
      const bodyWithNulls: UpdateJobRoleRequestDTO = {
        ...updateJobRoleDtoMock,
        description: null,
        responsibilities: null,
        sharePointLink: null,
        openPositions: null,
        closingDate: null,
      };
      req = { params: { id: "1" }, body: bodyWithNulls } as unknown as Request;
      updateJobRole.mockResolvedValue(jobRoleDetailedMock);

      await jobRoleController.updateJobRole(req, res, next);

      expect(updateJobRole).toHaveBeenCalledWith(1, bodyWithNulls);
    });

    it("responds with 404 when the service returns null", async () => {
      updateJobRole.mockResolvedValue(null);

      await jobRoleController.updateJobRole(req, res, next);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ message: "Job role not found" });
    });

    it("forwards errors to next when the service throws", async () => {
      const error = new Error("Service error");
      updateJobRole.mockRejectedValue(error);

      await jobRoleController.updateJobRole(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(status).not.toHaveBeenCalled();
    });
  });

  describe("deleteJobRole", () => {
    it("responds with 204 when the job role is deleted", async () => {
      deleteJobRole.mockResolvedValue(true);

      await jobRoleController.deleteJobRole(req, res, next);

      expect(status).toHaveBeenCalledWith(204);
      expect(send).toHaveBeenCalled();
    });

    it("calls the service with the id parsed from the route params", async () => {
      deleteJobRole.mockResolvedValue(true);

      await jobRoleController.deleteJobRole(req, res, next);

      expect(deleteJobRole).toHaveBeenCalledWith(1);
    });

    it("responds with 404 when the service returns false", async () => {
      deleteJobRole.mockResolvedValue(false);

      await jobRoleController.deleteJobRole(req, res, next);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ message: "Job role not found" });
    });

    it("forwards errors to next when the service throws", async () => {
      const error = new Error("Service error");
      deleteJobRole.mockRejectedValue(error);

      await jobRoleController.deleteJobRole(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(status).not.toHaveBeenCalled();
    });
  });
});
