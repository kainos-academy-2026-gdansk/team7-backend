import type { ApplicationResponseDto } from "../Dto/ApplicationDTO";
import type { ApplicationWithRelations } from "../models/Application";

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
}
