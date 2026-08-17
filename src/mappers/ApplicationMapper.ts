import type { AdminApplicationListItemDto } from "../Dto/ApplicationDTO";
import type { ApplicationResponseDto } from "../Dto/ApplicationDTO";
import type { ApplicationListItemDto } from "../Dto/ApplicationDTO";
import type { AdminApplicationListItemPayload } from "../models/Application";
import type { ApplicationWithRelations } from "../models/Application";
import type { ApplicationListItemPayload } from "../models/Application";

export class ApplicationMapper {
  private constructor() {}
  static toApplicationResponseDto(application: ApplicationWithRelations): ApplicationResponseDto {
    return {
      id: application.id,
      jobRoleId: application.jobRole.id,
      roleName: application.jobRole.roleName,
      experience: application.experience,
      salaryExpectation: application.salaryExpectation,
      skills: application.skills,
      status: application.status.statusName,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }

  static toApplicationListItemDto(application: ApplicationListItemPayload): ApplicationListItemDto {
    return {
      id: application.id,
      applicantEmail: application.applicant.email,
      status: application.status.statusName,
      experience: application.experience,
      salaryExpectation: application.salaryExpectation,
      skills: application.skills,

      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }

  static toAdminApplicationListItemDto(
    application: AdminApplicationListItemPayload,
  ): AdminApplicationListItemDto {
    return {
      id: application.id,
      jobRoleName: application.jobRole.roleName,
      applicantEmail: application.applicant.email,
      status: application.status.statusName,
      experience: application.experience,
      salaryExpectation: application.salaryExpectation,
      skills: application.skills,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };
  }
}
