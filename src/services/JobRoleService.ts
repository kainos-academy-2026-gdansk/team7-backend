import type { PrismaClient } from "@prisma/client";
import type { JobRoleGetAllSelectPayload } from "../models/JobRole";
import type { JobRoleDetailed } from "../models/JobRole";
export class JobRoleService {
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  async findAll(): Promise<JobRoleGetAllSelectPayload[]> {
    return await this.prismaClient.jobRole.findMany({
      select: {
        roleName: true,
        location: true,
        closingDate: true,
        band: {
          select: {
            name: true,
          },
        },
        capability: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async getJobRoleById(id: number): Promise<JobRoleDetailed | null> {
    const jobRoleDetails = await this.prismaClient.jobRole.findUnique({
      where: { id },
      include: {
        band: true,
        capability: true,
      },
    });

    if (!jobRoleDetails) {
      return null;
    }

    return {
      id: jobRoleDetails.id,
      jobRoleName: jobRoleDetails.roleName,
      description: jobRoleDetails.description,
      responsibilities: jobRoleDetails.responsibilities ?? "",
      link: jobRoleDetails.sharePointLink,
      location: jobRoleDetails.location,
      capability: jobRoleDetails.capability,
      band: jobRoleDetails.band,
      closingDate: jobRoleDetails.closingDate,
      status: jobRoleDetails.status,
      numberOfOpenPositions: jobRoleDetails.openPositions ?? 0,
    };
  }
}
