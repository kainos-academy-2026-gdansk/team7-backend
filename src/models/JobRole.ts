import type { Prisma } from "@prisma/client";
export type JobRoleGetAllSelectPayload = {
  id: number;
  roleName: string;
  location: string;
  closingDate: Date | null;
  band: { name: string };
  capability: { name: string };
  status: { statusName: string };
};

interface JobRoleDetailed {
  id: number;
  jobRoleName: string;
  description: string | null;
  responsibilities: string;
  sharepointUrl: string | null;
  location: string;
  capability: {
    id: number;
    name: string;
  };
  band: {
    id: number;
    name: string;
  };
  closingDate: Date | null;
  status: {
    statusId: number;
    statusName: string;
  };
  numberOfOpenPositions: number;
}

export type { JobRoleDetailed };

export type JobRoleWithRelations = Prisma.JobRoleGetPayload<{
  include: { band: true; capability: true; status: true };
}>;
