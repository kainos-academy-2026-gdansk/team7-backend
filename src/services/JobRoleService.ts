import type { PrismaClient } from "@prisma/client";
import type { JobRoleAllResponseDto } from "../Dto/JobRoleDto";
import { JobRoleMapper } from "../mappers/JobRoleMapper";

export class JobRoleService {
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  async findAll(): Promise<JobRoleAllResponseDto[]> {
    const roles = await this.prismaClient.jobRole.findMany({
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

    return roles.map(JobRoleMapper.toAllResponseDto);
  }
}
