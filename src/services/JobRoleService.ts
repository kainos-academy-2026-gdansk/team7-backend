import type { Prisma, PrismaClient } from "@prisma/client";
import type { AddJobRoleDto } from "../Dto/JobRoleDTO";
import type { UpdateJobRoleRequestDTO } from "../Dto/JobRoleDTO";
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

    return JobRoleService.toDetailed(jobRoleDetails);
  }

  async updateJobRole(id: number, data: UpdateJobRoleRequestDTO): Promise<JobRoleDetailed | null> {
    const exists = await this.prismaClient.jobRole.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return null;
    }

    const updated = await this.prismaClient.jobRole.update({
      where: { id },
      data: {
        roleName: data.jobRoleName,
        location: data.location,
        status: data.status,
        description: data.description,
        responsibilities: data.responsibilities,
        sharePointLink: data.sharePointLink,
        openPositions: data.openPositions,
        closingDate: data.closingDate,
        band: { connect: { name: data.bandName } },
        capability: { connect: { name: data.capabilityName } },
      },
      include: {
        band: true,
        capability: true,
      },
    });

    return JobRoleService.toDetailed(updated);
  }

  private static toDetailed(
    entity: Prisma.JobRoleGetPayload<{ include: { band: true; capability: true } }>,
  ): JobRoleDetailed {
    return {
      id: entity.id,
      jobRoleName: entity.roleName,
      description: entity.description,
      responsibilities: entity.responsibilities ?? "",
      link: entity.sharePointLink,
      location: entity.location,
      capability: entity.capability,
      band: entity.band,
      closingDate: entity.closingDate,
      status: entity.status,
      numberOfOpenPositions: entity.openPositions ?? 0,
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
}
