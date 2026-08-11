import type { PrismaClient } from "@prisma/client";
import type { AddJobRoleDto } from "../Dto/JobRoleDTO";
import type { JobRoleGetAllSelectPayload, JobRoleWithRelations } from "../models/JobRole";
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
        status: true,
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

  async createJobRole(data: AddJobRoleDto): Promise<JobRoleWithRelations> {
    return await this.prismaClient.jobRole.create({
      data: {
        roleName: data.roleName,
        location: data.location,
        closingDate: data.closingDate,
        status: "OPEN",
        description: data.description,
        responsibilities: data.responsibilities,
        openPositions: data.openPositions,
        sharePointLink: data.sharePointLink,
        bandId: data.bandId,
        capabilityId: data.capabilityId,
      },
      include: {
        band: true,
        capability: true,
      },
    });
  }

  async findAllBands(): Promise<Array<{ id: number; name: string }>> {
    return await this.prismaClient.band.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  }

  async findAllCapabilities(): Promise<Array<{ id: number; name: string }>> {
    return await this.prismaClient.capability.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  }
}
