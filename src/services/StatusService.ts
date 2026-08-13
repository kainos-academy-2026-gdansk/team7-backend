import type { PrismaClient } from "@prisma/client";

export class StatusService {
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  async findAll(): Promise<Array<{ statusId: number; statusName: string }>> {
    return await this.prismaClient.status.findMany({
      select: {
        statusId: true,
        statusName: true,
      },
      orderBy: {
        statusId: "asc",
      },
    });
  }
}
