import type { Prisma, PrismaClient } from "@prisma/client";
import { ZodError, type ZodIssue } from "zod";
import type { AddJobRoleDto, UpdateJobRoleRequestDTO } from "../Dto/JobRoleDTO";
import type { JobRoleGetAllSelectPayload, JobRoleWithRelations } from "../models/JobRole";
import type { JobRoleDetailed } from "../models/JobRole";

const DEFAULT_STATUS_NAME = "OPEN";

export class JobRoleService {
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  async findAll(): Promise<JobRoleGetAllSelectPayload[]> {
    return await this.prismaClient.jobRole.findMany({
      select: {
        id: true,
        roleName: true,
        location: true,
        closingDate: true,
        status: {
          select: {
            statusName: true,
          },
        },
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
        status: true,
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

    await this.assertRelationsExist(data);

    const updated = await this.prismaClient.jobRole.update({
      where: { id },
      data: {
        roleName: data.jobRoleName,
        location: data.location,
        description: data.description,
        responsibilities: data.responsibilities,
        sharepointUrl: data.sharepointUrl,
        numberOfOpenPositions: data.numberOfOpenPositions,
        closingDate: data.closingDate,
        status: { connect: { statusId: data.statusId } },
        band: { connect: { name: data.bandName } },
        capability: { connect: { name: data.capabilityName } },
      },
      include: {
        band: true,
        capability: true,
        status: true,
      },
    });

    return JobRoleService.toDetailed(updated);
  }

  private async assertRelationsExist(data: UpdateJobRoleRequestDTO): Promise<void> {
    const [band, capability, status] = await Promise.all([
      this.prismaClient.band.findUnique({ where: { name: data.bandName }, select: { id: true } }),
      this.prismaClient.capability.findUnique({
        where: { name: data.capabilityName },
        select: { id: true },
      }),
      this.prismaClient.status.findUnique({
        where: { statusId: data.statusId },
        select: { statusId: true },
      }),
    ]);

    const issues: ZodIssue[] = [];
    if (!band) {
      issues.push({
        code: "custom",
        path: ["bandName"],
        message: `Band "${data.bandName}" does not exist`,
        input: data.bandName,
      });
    }
    if (!capability) {
      issues.push({
        code: "custom",
        path: ["capabilityName"],
        message: `Capability "${data.capabilityName}" does not exist`,
        input: data.capabilityName,
      });
    }
    if (!status) {
      issues.push({
        code: "custom",
        path: ["statusId"],
        message: `Status "${data.statusId}" does not exist`,
        input: data.statusId,
      });
    }

    if (issues.length > 0) {
      throw new ZodError(issues);
    }
  }

  private static toDetailed(
    entity: Prisma.JobRoleGetPayload<{
      include: { band: true; capability: true; status: true };
    }>,
  ): JobRoleDetailed {
    return {
      id: entity.id,
      jobRoleName: entity.roleName,
      description: entity.description,
      responsibilities: entity.responsibilities ?? "",
      sharepointUrl: entity.sharepointUrl,
      location: entity.location,
      capability: entity.capability,
      band: entity.band,
      closingDate: entity.closingDate,
      status: entity.status,
      numberOfOpenPositions: entity.numberOfOpenPositions ?? 0,
    };
  }

  async createJobRole(data: AddJobRoleDto): Promise<JobRoleWithRelations> {
    const openStatus = await this.prismaClient.status.findUnique({
      where: { statusName: DEFAULT_STATUS_NAME },
      select: { statusId: true },
    });

    if (!openStatus) {
      throw new Error(`Status "${DEFAULT_STATUS_NAME}" is not configured`);
    }

    return await this.prismaClient.jobRole.create({
      data: {
        roleName: data.roleName,
        location: data.location,
        closingDate: data.closingDate,
        statusId: openStatus.statusId,
        description: data.description,
        responsibilities: data.responsibilities,
        numberOfOpenPositions: data.numberOfOpenPositions,
        sharepointUrl: data.sharepointUrl,
        bandId: data.bandId,
        capabilityId: data.capabilityId,
      },
      include: {
        band: true,
        capability: true,
        status: true,
      },
    });
  }

  async deleteJobRole(id: number): Promise<boolean> {
    const jobRole = await this.prismaClient.jobRole.findUnique({ where: { id } });

    if (!jobRole) {
      return false;
    }

    await this.prismaClient.jobRole.delete({ where: { id } });
    return true;
  }
}
