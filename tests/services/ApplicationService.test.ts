import { Prisma, type PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApplicationConflictError,
  ApplicationService,
} from "../../src/services/ApplicationService";

const findJobRole = vi.fn();
const findApplication = vi.fn();
const createApplication = vi.fn();
const findApplications = vi.fn();
const findStatus = vi.fn();
const dbMock = {
  jobRole: { findUnique: findJobRole },
  application: {
    findUnique: findApplication,
    create: createApplication,
    findMany: findApplications,
  },
  status: { findUnique: findStatus },
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

describe("ApplicationService", () => {
  let applicationService: ApplicationService;

  beforeEach(() => {
    vi.resetAllMocks();
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
});
