import type { PrismaClient } from "@prisma/client";

export class CapabilityService {
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  async findAll(): Promise<Array<{ id: number; name: string }>> {
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
