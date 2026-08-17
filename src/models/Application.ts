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
export type ApplicationListItemPayload = Prisma.ApplicationGetPayload<{
  select: {
    id: true;
    experience: true;
    salaryExpectation: true;
    skills: true;
    createdAt: true;
    updatedAt: true;
    applicant: { select: { email: true } };
    status: { select: { statusName: true } };
  };
}>;
export type AdminApplicationListItemPayload = Prisma.ApplicationGetPayload<{
  select: {
    id: true;
    experience: true;
    salaryExpectation: true;
    skills: true;
    createdAt: true;
    updatedAt: true;
    applicant: { select: { email: true } };
    status: { select: { statusName: true } };
    jobRole: { select: { roleName: true } };
  };
}>;

export interface UpdateApplicationStatusResult {
  application: ApplicationListItemPayload;
  numberOfOpenPositions: number | null;
}
