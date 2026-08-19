import { z } from "zod";

export const CreateApplicationSchema = z
  .object({
    experience: z
      .string()
      .trim()
      .min(1, "Experience is required")
      .max(1000, "Experience must not exceed 1000 characters"),
    salaryExpectation: z
      .string()
      .trim()
      .min(1, "Salary expectation is required")
      .max(100, "Salary expectation must not exceed 100 characters"),
    skills: z
      .string()
      .trim()
      .min(1, "Skills are required")
      .max(2000, "Skills must not exceed 2000 characters"),
  })
  .strict();

export type CreateApplicationRequestDto = z.infer<typeof CreateApplicationSchema>;

export interface ApplicationResponseDto {
  id: number;
  jobRoleId: number;
  roleName: string;
  experience: string;
  salaryExpectation: string;
  skills: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
export interface ApplicationListItemDto {
  id: number;
  applicantEmail: string;
  status: string;
  experience: string;
  salaryExpectation: string;
  skills: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminApplicationListItemDto {
  id: number;
  jobRoleName: string;
  applicantEmail: string;
  status: string;
  experience: string;
  salaryExpectation: string;
  skills: string;
  createdAt: string;
  updatedAt: string;
}

export const UpdateApplicationStatusSchema = z
  .object({
    status: z.enum(["HIRED", "REJECTED"]),
  })
  .strict();

export type UpdateApplicationStatusRequestDto = z.infer<typeof UpdateApplicationStatusSchema>;

export interface UpdateApplicationStatusResponseDto {
  application: ApplicationListItemDto;
  numberOfOpenPositions: number | null;
}
