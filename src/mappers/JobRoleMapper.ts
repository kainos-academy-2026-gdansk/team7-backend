import type { JobRoleAllResponseDto, JobRoleDetailedDTO } from "../Dto/JobRoleDTO";
import type { JobRoleGetAllSelectPayload } from "../models/JobRole";
import type { JobRoleDetailed } from "../models/JobRole";
export class JobRoleMapper {
  private constructor() {}

  static toAllResponseDto(role: JobRoleGetAllSelectPayload): JobRoleAllResponseDto {
    return {
      roleName: role.roleName,
      location: role.location,
      capability: role.capability.name,
      band: role.band.name,
      closingDate: role.closingDate ? role.closingDate.toISOString() : null,
      status: role.status,
    };
  }
  static toJobRoleDetailedDto(jobRoleDetailed: JobRoleDetailed): JobRoleDetailedDTO {
    return {
      id: jobRoleDetailed.id,
      jobRoleName: jobRoleDetailed.jobRoleName,
      description: jobRoleDetailed.description,
      responsibilities: jobRoleDetailed.responsibilities,
      link: jobRoleDetailed.link,
      location: jobRoleDetailed.location,
      capability: jobRoleDetailed.capability.name,
      band: jobRoleDetailed.band.name,
      closingDate: jobRoleDetailed.closingDate ? jobRoleDetailed.closingDate.toISOString() : null,
      status: jobRoleDetailed.status,
      numberOfOpenPositions: jobRoleDetailed.numberOfOpenPositions,
    };
  }
}
