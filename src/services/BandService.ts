import type { PrismaClient } from "@prisma/client";

export class BandService {
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  async findAll(): Promise<Array<{ id: number; name: string }>> {
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
}
