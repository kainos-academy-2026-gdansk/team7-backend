import type { Prisma } from "@prisma/client";

export type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: {
    jobRole: {
      select: {
        id: true;
        roleName: true;
      };
    };
    status: {
      select: {
        statusName: true;
      };
    };
  };
}>;
