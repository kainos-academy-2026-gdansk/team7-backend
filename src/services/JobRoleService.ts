import type { PrismaClient } from "@prisma/client";
import type { JobRoleGetAllSelectPayload } from "../models/JobRole";

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
}
