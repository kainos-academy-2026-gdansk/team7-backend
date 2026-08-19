import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationController } from "../../src/controllers/ApplicationController";
import type { ApplicationListItemPayload } from "../../src/models/Application";
import type { AdminApplicationListItemPayload } from "../../src/models/Application";
import {
  ApplicationConflictError,
  type ApplicationService,
} from "../../src/services/ApplicationService";

const createApplication = vi.fn();
const findByApplicantId = vi.fn();
const findByJobRoleId = vi.fn();
const findAllForAdmin = vi.fn();
const updateStatus = vi.fn();
const applicationServiceMock = {
  createApplication,
  findByApplicantId,
  findByJobRoleId,
  findAllForAdmin,
  updateStatus,
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
const applicationListItem: ApplicationListItemPayload = {
  id: 1,
  experience: application.experience,
  salaryExpectation: application.salaryExpectation,
  skills: application.skills,
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
  applicant: { email: "applicant@example.com" },
  status: application.status,
};
const adminApplicationListItem: AdminApplicationListItemPayload = {
  ...applicationListItem,
  jobRole: { roleName: "Software Engineer" },
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

  it("lists applications for an existing job role", async () => {
    req = { params: { id: "12" } } as unknown as Request;
    findByJobRoleId.mockResolvedValue([applicationListItem]);

    await applicationController.getApplicationsByJobRoleId(req, res, next);

    expect(findByJobRoleId).toHaveBeenCalledWith(12);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([
      expect.objectContaining({ applicantEmail: "applicant@example.com", status: "IN_PROGRESS" }),
    ]);
  });

  it("returns 404 when the job role application list is unavailable", async () => {
    findByJobRoleId.mockResolvedValue(null);
    await applicationController.getApplicationsByJobRoleId(req, res, next);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: "Job role not found" });
  });

  it("returns 200 with every application for admins", async () => {
    findAllForAdmin.mockResolvedValue([adminApplicationListItem]);

    await applicationController.getAllApplications(req, res, next);

    expect(findAllForAdmin).toHaveBeenCalledWith();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([
      expect.objectContaining({
        jobRoleName: "Software Engineer",
        applicantEmail: "applicant@example.com",
        status: "IN_PROGRESS",
      }),
    ]);
  });

  it("forwards unexpected failures when listing every application", async () => {
    const error = new Error("Database failure");
    findAllForAdmin.mockRejectedValue(error);

    await applicationController.getAllApplications(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("updates an application status", async () => {
    req = {
      params: { id: "12", applicationId: "1" },
      body: { status: "HIRED" },
    } as unknown as Request;
    updateStatus.mockResolvedValue({ application: applicationListItem, numberOfOpenPositions: 1 });

    await applicationController.updateStatus(req, res, next);

    expect(updateStatus).toHaveBeenCalledWith(12, 1, "HIRED");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ numberOfOpenPositions: 1 }));
  });

  it("returns 404 when the application does not belong to the job role", async () => {
    req = {
      params: { id: "12", applicationId: "1" },
      body: { status: "HIRED" },
    } as unknown as Request;
    updateStatus.mockResolvedValue(null);
    await applicationController.updateStatus(req, res, next);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: "Application not found" });
  });
});
