import { z } from "zod";

export const JobRoleStatusSchema = z.enum(["OPEN", "CLOSED"]);
export type JobRoleStatus = z.infer<typeof JobRoleStatusSchema>;

export interface JobRoleAllResponseDto {
  roleName: string;
  location: string;
  capability: string;
  band: string;
  closingDate: string | null;
  status: JobRoleStatus;
}

interface JobRoleDetailedDTO {
  id: number;
  jobRoleName: string;
  description: string | null;
  responsibilities: string;
  link: string | null;
  location: string;
  capability: string;
  band: string;
  closingDate: string | null;
  status: JobRoleStatus;
  numberOfOpenPositions: number;
}

export const updateJobRoleSchema = z
  .object({
    jobRoleName: z.string().trim().min(1, "Role name is required").max(100),
    location: z.string().trim().min(1, "Location is required").max(100),
    status: JobRoleStatusSchema,
    bandName: z.string().trim().min(1, "Band is required"),
    capabilityName: z.string().trim().min(1, "Capability is required"),
    description: z.string().trim().max(2000).nullable(),
    responsibilities: z.string().trim().max(2000).nullable(),
    sharePointLink: z.url("Must be a valid URL").nullable(),
    openPositions: z.number().int().nonnegative().nullable(),
    closingDate: z.iso.datetime("Must be an ISO 8601 date-time").nullable(),
  })
  .strict();

export type UpdateJobRoleRequestDTO = z.infer<typeof updateJobRoleSchema>;

export type { JobRoleDetailedDTO };

export const AddJobRoleRequestSchema = z.object({
  roleName: z
    .string()
    .min(1, "Role name is required")
    .max(255, "Role name must not exceed 255 characters"),
  location: z
    .string()
    .min(1, "Location is required")
    .max(255, "Location must not exceed 255 characters"),
  bandId: z
    .number()
    .int("Band ID must be an integer")
    .positive("Band ID must be a positive number"),
  capabilityId: z
    .number()
    .int("Capability ID must be an integer")
    .positive("Capability ID must be a positive number"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  responsibilities: z
    .string()
    .max(2000, "Responsibilities must not exceed 2000 characters")
    .optional()
    .nullable(),
  openPositions: z
    .number()
    .int("Open positions must be an integer")
    .nonnegative("Open positions must be a non-negative number")
    .optional()
    .nullable(),
  sharePointLink: z.string().url("SharePoint link must be a valid URL").optional().nullable(),
  closingDate: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

export type AddJobRoleRequestDto = z.input<typeof AddJobRoleRequestSchema>;
export type AddJobRoleDto = z.infer<typeof AddJobRoleRequestSchema>;

export interface AddJobRoleResponseDto {
  id: number;
  roleName: string;
  location: string;
  status: JobRoleStatus;
  band: string;
  capability: string;
  description: string | null;
  responsibilities: string | null;
  openPositions: number | null;
  sharePointLink: string | null;
  closingDate: string | null;
}

export const AddJobRoleSchema = AddJobRoleRequestSchema;
