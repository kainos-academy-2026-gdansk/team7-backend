import type { JobRoleStatus } from "../Dto/JobRoleDTO";
export type JobRoleGetAllSelectPayload = {
  roleName: string;
  location: string;
  closingDate: Date | null;
  band: { name: string };
  capability: { name: string };
};

interface JobRoleDetailed {
  id: number;
  jobRoleName: string;
  description: string | null;
  responsibilities: string;
  link: string | null;
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
  status: JobRoleStatus;
  numberOfOpenPositions: number;
}
export type { JobRoleDetailed };
