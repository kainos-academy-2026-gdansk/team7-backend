import { Prisma, type PrismaClient } from "@prisma/client";
import type { CreateApplicationRequestDto } from "../Dto/ApplicationDTO";
import type { ApplicationWithRelations } from "../models/Application";

const OPEN_STATUS_NAME = "OPEN";
const IN_PROGRESS_STATUS_NAME = "IN_PROGRESS";

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
      select: {
        numberOfOpenPositions: true,
        status: {
          select: {
            statusName: true,
          },
        },
      },
    });

    if (!jobRole) {
      return null;
    }

    if (
      jobRole.status.statusName !== OPEN_STATUS_NAME ||
      !jobRole.numberOfOpenPositions ||
      jobRole.numberOfOpenPositions <= 0
    ) {
      throw new ApplicationConflictError("Job role is not accepting applications");
    }

    const existingApplication = await this.prismaClient.application.findUnique({
      where: {
        applicantId_jobRoleId: {
          applicantId,
          jobRoleId,
        },
      },
      select: { id: true },
    });

    if (existingApplication) {
      throw new ApplicationConflictError("You have already applied for this job role");
    }

    const inProgressStatus = await this.prismaClient.status.findUnique({
      where: { statusName: IN_PROGRESS_STATUS_NAME },
      select: { statusId: true },
    });

    if (!inProgressStatus) {
      throw new Error(`Status "${IN_PROGRESS_STATUS_NAME}" is not configured`);
    }

    try {
      return await this.prismaClient.application.create({
        data: {
          applicantId,
          jobRoleId,
          statusId: inProgressStatus.statusId,
          experience: data.experience,
          salaryExpectation: data.salaryExpectation,
          skills: data.skills,
        },
        include: {
          jobRole: {
            select: {
              id: true,
              roleName: true,
            },
          },
          status: {
            select: {
              statusName: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApplicationConflictError("You have already applied for this job role");
      }

      throw error;
    }
  }

  async findByApplicantId(applicantId: number): Promise<ApplicationWithRelations[]> {
    return await this.prismaClient.application.findMany({
      where: { applicantId },
      include: {
        jobRole: {
          select: {
            id: true,
            roleName: true,
          },
        },
        status: {
          select: {
            statusName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
