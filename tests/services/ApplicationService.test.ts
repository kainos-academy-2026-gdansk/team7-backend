import { Prisma, type PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError } from "../../src/lib/HttpError";
import type {
  AdminApplicationListItemPayload,
  ApplicationListItemPayload,
} from "../../src/models/Application";
import {
  ApplicationConflictError,
  ApplicationService,
} from "../../src/services/ApplicationService";

const findJobRole = vi.fn();
const findApplication = vi.fn();
const createApplication = vi.fn();
const findApplications = vi.fn();
const findStatus = vi.fn();
const updateApplication = vi.fn();
const findApplicationForTransition = vi.fn();
const getUpdatedApplication = vi.fn();
const updateJobRole = vi.fn();
const getUpdatedJobRole = vi.fn();
const transaction = vi.fn();
const transactionMock = {
  status: { findUnique: findStatus },
  application: {
    updateMany: updateApplication,
    findFirst: findApplicationForTransition,
    findUniqueOrThrow: getUpdatedApplication,
  },
  jobRole: { updateMany: updateJobRole, findUniqueOrThrow: getUpdatedJobRole },
};
const dbMock = {
  jobRole: { findUnique: findJobRole },
  application: {
    findUnique: findApplication,
    create: createApplication,
    findMany: findApplications,
  },
  status: { findUnique: findStatus },
  $transaction: transaction,
} as unknown as PrismaClient;

const requestBody = {
  experience: "Three years building backend services",
  salaryExpectation: "60000 GBP annually",
  skills: "TypeScript, Node.js, PostgreSQL",
};

const application = {
  id: 1,
  applicantId: 7,
  jobRoleId: 12,
  statusId: 3,
  experience: requestBody.experience,
  salaryExpectation: requestBody.salaryExpectation,
  skills: requestBody.skills,
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

describe("ApplicationService", () => {
  let applicationService: ApplicationService;

  beforeEach(() => {
    vi.resetAllMocks();
    transaction.mockImplementation(async (callback) => await callback(transactionMock));
    applicationService = new ApplicationService(dbMock);
  });

  describe("createApplication", () => {
    beforeEach(() => {
      findJobRole.mockResolvedValue({
        numberOfOpenPositions: 2,
        status: { statusName: "OPEN" },
      });
      findApplication.mockResolvedValue(null);
      findStatus.mockResolvedValue({ statusId: 3 });
      createApplication.mockResolvedValue(application);
    });

    it("creates an IN_PROGRESS application for an eligible role", async () => {
      const result = await applicationService.createApplication(7, 12, requestBody);

      expect(result).toEqual(application);
      expect(findJobRole).toHaveBeenCalledWith({
        where: { id: 12 },
        select: {
          numberOfOpenPositions: true,
          status: { select: { statusName: true } },
        },
      });
      expect(findStatus).toHaveBeenCalledWith({
        where: { statusName: "IN_PROGRESS" },
        select: { statusId: true },
      });
      expect(createApplication).toHaveBeenCalledWith({
        data: {
          applicantId: 7,
          jobRoleId: 12,
          statusId: 3,
          experience: requestBody.experience,
          salaryExpectation: requestBody.salaryExpectation,
          skills: requestBody.skills,
        },
        include: {
          jobRole: { select: { id: true, roleName: true } },
          status: { select: { statusName: true } },
        },
      });
    });

    it("trims submitted values before persisting the application", async () => {
      const paddedRequestBody = {
        experience: `  ${requestBody.experience}  `,
        salaryExpectation: `  ${requestBody.salaryExpectation}  `,
        skills: `  ${requestBody.skills}  `,
      };

      await applicationService.createApplication(7, 12, paddedRequestBody);

      expect(createApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            experience: requestBody.experience,
            salaryExpectation: requestBody.salaryExpectation,
            skills: requestBody.skills,
          }),
        }),
      );
    });

    it("returns null when the job role does not exist", async () => {
      findJobRole.mockResolvedValue(null);

      await expect(applicationService.createApplication(7, 999, requestBody)).resolves.toBeNull();
      expect(findApplication).not.toHaveBeenCalled();
      expect(createApplication).not.toHaveBeenCalled();
    });

    it.each([
      { status: { statusName: "CLOSED" }, numberOfOpenPositions: 2 },
      { status: { statusName: "OPEN" }, numberOfOpenPositions: 0 },
      { status: { statusName: "OPEN" }, numberOfOpenPositions: null },
    ])("rejects a role that cannot accept applications", async (role) => {
      findJobRole.mockResolvedValue(role);

      await expect(applicationService.createApplication(7, 12, requestBody)).rejects.toEqual(
        new ApplicationConflictError("Job role is not accepting applications"),
      );
      expect(findApplication).not.toHaveBeenCalled();
      expect(createApplication).not.toHaveBeenCalled();
    });

    it("rejects a duplicate application before creating a row", async () => {
      findApplication.mockResolvedValue({ id: 9 });

      await expect(applicationService.createApplication(7, 12, requestBody)).rejects.toEqual(
        new ApplicationConflictError("You have already applied for this job role"),
      );
      expect(findApplication).toHaveBeenCalledWith({
        where: { applicantId_jobRoleId: { applicantId: 7, jobRoleId: 12 } },
        select: { id: true },
      });
      expect(createApplication).not.toHaveBeenCalled();
    });

    it("translates a concurrent unique constraint failure into a duplicate conflict", async () => {
      createApplication.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Duplicate application", {
          code: "P2002",
          clientVersion: "6.19.3",
        }),
      );

      await expect(applicationService.createApplication(7, 12, requestBody)).rejects.toEqual(
        new ApplicationConflictError("You have already applied for this job role"),
      );
    });
  });

  describe("findByApplicantId", () => {
    it("returns only the applicant's applications oldest first", async () => {
      findApplications.mockResolvedValue([application]);

      const result = await applicationService.findByApplicantId(7);

      expect(result).toEqual([application]);
      expect(findApplications).toHaveBeenCalledWith({
        where: { applicantId: 7 },
        include: {
          jobRole: { select: { id: true, roleName: true } },
          status: { select: { statusName: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("findByJobRoleId", () => {
    it("returns null without querying applications when the job role is missing", async () => {
      findJobRole.mockResolvedValue(null);
      await expect(applicationService.findByJobRoleId(999)).resolves.toBeNull();
      expect(findApplications).not.toHaveBeenCalled();
    });

    it("lists an existing job role's applications oldest first", async () => {
      findJobRole.mockResolvedValue({ id: 12 });
      findApplications.mockResolvedValue([applicationListItem]);

      await expect(applicationService.findByJobRoleId(12)).resolves.toEqual([applicationListItem]);
      expect(findApplications).toHaveBeenCalledWith({
        where: { jobRoleId: 12 },
        select: {
          id: true,
          experience: true,
          salaryExpectation: true,
          skills: true,
          createdAt: true,
          updatedAt: true,
          applicant: { select: { email: true } },
          status: { select: { statusName: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("findAllForAdmin", () => {
    it("returns every application newest first with job role names", async () => {
      findApplications.mockResolvedValue([adminApplicationListItem]);

      await expect(applicationService.findAllForAdmin()).resolves.toEqual([
        adminApplicationListItem,
      ]);
      expect(findApplications).toHaveBeenCalledWith({
        select: {
          id: true,
          experience: true,
          salaryExpectation: true,
          skills: true,
          createdAt: true,
          updatedAt: true,
          applicant: { select: { email: true } },
          status: { select: { statusName: true } },
          jobRole: { select: { roleName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("returns an empty array when there are no applications", async () => {
      findApplications.mockResolvedValue([]);

      await expect(applicationService.findAllForAdmin()).resolves.toEqual([]);
    });
  });

  describe("updateStatus", () => {
    beforeEach(() => {
      findStatus.mockImplementation(({ where }: { where: { statusName: string } }) => {
        const ids = { IN_PROGRESS: 1, HIRED: 2, REJECTED: 3 };
        return Promise.resolve({ statusId: ids[where.statusName as keyof typeof ids] });
      });
      getUpdatedApplication.mockResolvedValue(applicationListItem);
      getUpdatedJobRole.mockResolvedValue({ numberOfOpenPositions: 1 });
    });

    it("hires an in-progress application and decrements the position count", async () => {
      updateApplication.mockResolvedValue({ count: 1 });
      updateJobRole.mockResolvedValue({ count: 1 });

      await expect(applicationService.updateStatus(12, 1, "HIRED")).resolves.toEqual({
        application: applicationListItem,
        numberOfOpenPositions: 1,
      });
      expect(updateJobRole).toHaveBeenCalledWith({
        where: { id: 12, numberOfOpenPositions: { gt: 0 } },
        data: { numberOfOpenPositions: { decrement: 1 } },
      });
    });

    it("rejects without changing the position count", async () => {
      updateApplication.mockResolvedValue({ count: 1 });
      await applicationService.updateStatus(12, 1, "REJECTED");
      expect(updateJobRole).not.toHaveBeenCalled();
    });

    it("returns null for an application outside the job role", async () => {
      updateApplication.mockResolvedValue({ count: 0 });
      findApplicationForTransition.mockResolvedValue(null);
      await expect(applicationService.updateStatus(12, 1, "HIRED")).resolves.toBeNull();
    });

    it("rejects processed applications and unavailable positions", async () => {
      updateApplication.mockResolvedValueOnce({ count: 0 });
      findApplicationForTransition.mockResolvedValueOnce({ id: 1 });
      await expect(applicationService.updateStatus(12, 1, "HIRED")).rejects.toEqual(
        new ConflictError("Application is no longer in progress"),
      );
      updateApplication.mockResolvedValueOnce({ count: 1 });
      updateJobRole.mockResolvedValueOnce({ count: 0 });
      await expect(applicationService.updateStatus(12, 1, "HIRED")).rejects.toEqual(
        new ConflictError("No open positions are available"),
      );
    });
  });
});
