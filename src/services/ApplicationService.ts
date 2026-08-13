import { Prisma, type PrismaClient } from "@prisma/client";
import type { CreateApplicationRequestDto } from "../Dto/ApplicationDTO";
import { ConflictError } from "../lib/HttpError";
import type {
  ApplicationListItemPayload,
  ApplicationWithRelations,
  UpdateApplicationStatusResult,
} from "../models/Application";

const OPEN_STATUS_NAME = "OPEN";
const APPLICATION_STATUS_NAMES = {
  IN_PROGRESS: "IN_PROGRESS",
  HIRED: "HIRED",
  REJECTED: "REJECTED",
} as const;

export class ApplicationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationConflictError";
  }
}

export class ApplicationService {
  constructor(private readonly prismaClient: PrismaClient) {}
  async createApplication(
    applicantId: number,
    jobRoleId: number,
    data: CreateApplicationRequestDto,
  ): Promise<ApplicationWithRelations | null> {
    const jobRole = await this.prismaClient.jobRole.findUnique({
      where: { id: jobRoleId },
      select: { numberOfOpenPositions: true, status: { select: { statusName: true } } },
    });
    if (!jobRole) return null;
    if (
      jobRole.status.statusName !== OPEN_STATUS_NAME ||
      !jobRole.numberOfOpenPositions ||
      jobRole.numberOfOpenPositions <= 0
    )
      throw new ApplicationConflictError("Job role is not accepting applications");
    const existingApplication = await this.prismaClient.application.findUnique({
      where: { applicantId_jobRoleId: { applicantId, jobRoleId } },
      select: { id: true },
    });
    if (existingApplication)
      throw new ApplicationConflictError("You have already applied for this job role");
    const inProgressStatus = await this.prismaClient.status.findUnique({
      where: { statusName: APPLICATION_STATUS_NAMES.IN_PROGRESS },
      select: { statusId: true },
    });
    if (!inProgressStatus)
      throw new Error(`Status "${APPLICATION_STATUS_NAMES.IN_PROGRESS}" is not configured`);
    try {
      return await this.prismaClient.application.create({
        data: {
          applicantId,
          jobRoleId,
          statusId: inProgressStatus.statusId,
          experience: data.experience.trim(),
          salaryExpectation: data.salaryExpectation.trim(),
          skills: data.skills.trim(),
        },
        include: {
          jobRole: { select: { id: true, roleName: true } },
          status: { select: { statusName: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        throw new ApplicationConflictError("You have already applied for this job role");
      throw error;
    }
  }

  async findByApplicantId(applicantId: number): Promise<ApplicationWithRelations[]> {
    return await this.prismaClient.application.findMany({
      where: { applicantId },
      include: {
        jobRole: { select: { id: true, roleName: true } },
        status: { select: { statusName: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findByJobRoleId(jobRoleId: number): Promise<ApplicationListItemPayload[] | null> {
    const jobRole = await this.prismaClient.jobRole.findUnique({
      where: { id: jobRoleId },
      select: { id: true },
    });
    if (!jobRole) return null;
    return await this.prismaClient.application.findMany({
      where: { jobRoleId },
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
  }

  async updateStatus(
    jobRoleId: number,
    applicationId: number,
    targetStatus: "HIRED" | "REJECTED",
  ): Promise<UpdateApplicationStatusResult | null> {
    return await this.prismaClient.$transaction(async (transaction) => {
      const [inProgressStatus, hiredStatus, rejectedStatus] = await Promise.all([
        transaction.status.findUnique({
          where: { statusName: APPLICATION_STATUS_NAMES.IN_PROGRESS },
          select: { statusId: true },
        }),
        transaction.status.findUnique({
          where: { statusName: APPLICATION_STATUS_NAMES.HIRED },
          select: { statusId: true },
        }),
        transaction.status.findUnique({
          where: { statusName: APPLICATION_STATUS_NAMES.REJECTED },
          select: { statusId: true },
        }),
      ]);
      if (!inProgressStatus || !hiredStatus || !rejectedStatus)
        throw new Error("Application statuses are not configured");
      const targetStatusId =
        targetStatus === "HIRED" ? hiredStatus.statusId : rejectedStatus.statusId;
      const updatedApplication = await transaction.application.updateMany({
        where: { id: applicationId, jobRoleId, statusId: inProgressStatus.statusId },
        data: { statusId: targetStatusId },
      });
      if (updatedApplication.count === 0) {
        const application = await transaction.application.findFirst({
          where: { id: applicationId, jobRoleId },
          select: { id: true },
        });
        if (!application) return null;
        throw new ConflictError("Application is no longer in progress");
      }
      if (targetStatus === "HIRED") {
        const updatedJobRole = await transaction.jobRole.updateMany({
          where: { id: jobRoleId, numberOfOpenPositions: { gt: 0 } },
          data: { numberOfOpenPositions: { decrement: 1 } },
        });
        if (updatedJobRole.count === 0) throw new ConflictError("No open positions are available");
      }
      const [application, jobRole] = await Promise.all([
        transaction.application.findUniqueOrThrow({
          where: { id: applicationId },
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
        }),
        transaction.jobRole.findUniqueOrThrow({
          where: { id: jobRoleId },
          select: { numberOfOpenPositions: true },
        }),
      ]);
      return { application, numberOfOpenPositions: jobRole.numberOfOpenPositions };
    });
  }
}
