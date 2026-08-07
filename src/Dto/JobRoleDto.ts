import { z } from "zod";

export const JobRoleStatusSchema = z.enum(["OPEN", "CLOSED"]);
export type JobRoleStatus = z.infer<typeof JobRoleStatusSchema>;

export interface JobRoleAllResponseDto {
  roleName: string;
  location: string;
  capability: string;
  band: string;
  closingDate: string | null;
}
