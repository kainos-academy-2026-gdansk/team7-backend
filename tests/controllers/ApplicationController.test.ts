import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationController } from "../../src/controllers/ApplicationController";
import {
  ApplicationConflictError,
  type ApplicationService,
} from "../../src/services/ApplicationService";

const createApplication = vi.fn();
const findByApplicantId = vi.fn();
const applicationServiceMock = {
  createApplication,
  findByApplicantId,
} as unknown as ApplicationService;

const application = {
  id: 1,
  applicantId: 7,
  jobRoleId: 12,
  statusId: 3,
  experience: "Three years building backend services",
  salaryExpectation: "60000 GBP annually",
  skills: "TypeScript, Node.js, PostgreSQL",
  createdAt: new Date("2026-08-13T12:00:00.000Z"),
  updatedAt: new Date("2026-08-13T12:00:00.000Z"),
  jobRole: { id: 12, roleName: "Software Engineer" },
  status: { statusName: "IN_PROGRESS" },
};

describe("ApplicationController", () => {
  let applicationController: ApplicationController;
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let status: ReturnType<typeof vi.fn>;
  let json: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    status = vi.fn().mockReturnThis();
    json = vi.fn();
    res = { status, json } as unknown as Response;
    next = vi.fn();
    req = {
      params: { id: "12" },
      user: { sub: 7, email: "applicant@example.com", role: "USER" },
      body: {
        experience: "Three years building backend services",
        salaryExpectation: "60000 GBP annually",
        skills: "TypeScript, Node.js, PostgreSQL",
      },
    } as unknown as Request;
    applicationController = new ApplicationController(applicationServiceMock);
  });

  it("returns 201 with the created application", async () => {
    createApplication.mockResolvedValue(application);

    await applicationController.applyForJobRole(req, res, next);

    expect(createApplication).toHaveBeenCalledWith(7, 12, req.body);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      id: 1,
      jobRoleId: 12,
      roleName: "Software Engineer",
      experience: "Three years building backend services",
      salaryExpectation: "60000 GBP annually",
      skills: "TypeScript, Node.js, PostgreSQL",
      status: "IN_PROGRESS",
      createdAt: "2026-08-13T12:00:00.000Z",
      updatedAt: "2026-08-13T12:00:00.000Z",
    });
  });

  it("returns 404 when the job role does not exist", async () => {
    createApplication.mockResolvedValue(null);

    await applicationController.applyForJobRole(req, res, next);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: "Job role not found" });
  });

  it("returns 409 for an application conflict", async () => {
    createApplication.mockRejectedValue(
      new ApplicationConflictError("Job role is not accepting applications"),
    );

    await applicationController.applyForJobRole(req, res, next);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ message: "Job role is not accepting applications" });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards unexpected creation failures", async () => {
    const error = new Error("Database failure");
    createApplication.mockRejectedValue(error);

    await applicationController.applyForJobRole(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns 200 with the applicant's applications", async () => {
    findByApplicantId.mockResolvedValue([application]);

    await applicationController.getMyApplications(req, res, next);

    expect(findByApplicantId).toHaveBeenCalledWith(7);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 1,
        jobRoleId: 12,
        roleName: "Software Engineer",
        status: "IN_PROGRESS",
      }),
    ]);
  });
});
