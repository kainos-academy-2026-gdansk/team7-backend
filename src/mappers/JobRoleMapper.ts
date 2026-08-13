import type { Band, Capability, JobRole, Status } from "@prisma/client";
import type {
  AddJobRoleResponseDto,
  JobRoleAllResponseDto,
  JobRoleDetailedDTO,
} from "../Dto/JobRoleDTO";
import type { JobRoleGetAllSelectPayload } from "../models/JobRole";
import type { JobRoleDetailed } from "../models/JobRole";
export class JobRoleMapper {
  private constructor() {}

  static toAllResponseDto(role: JobRoleGetAllSelectPayload): JobRoleAllResponseDto {
    return {
      id: role.id,
      roleName: role.roleName,
      location: role.location,
      capability: role.capability.name,
      band: role.band.name,
      closingDate: role.closingDate ? role.closingDate.toISOString() : null,
      status: role.status.statusName,
    };
  }
  static toJobRoleDetailedDto(jobRoleDetailed: JobRoleDetailed): JobRoleDetailedDTO {
    return {
      id: jobRoleDetailed.id,
      jobRoleName: jobRoleDetailed.jobRoleName,
      description: jobRoleDetailed.description,
      responsibilities: jobRoleDetailed.responsibilities,
      sharepointUrl: jobRoleDetailed.sharepointUrl,
      location: jobRoleDetailed.location,
      capability: jobRoleDetailed.capability.name,
      band: jobRoleDetailed.band.name,
      closingDate: jobRoleDetailed.closingDate ? jobRoleDetailed.closingDate.toISOString() : null,
      status: jobRoleDetailed.status.statusName,
      numberOfOpenPositions: jobRoleDetailed.numberOfOpenPositions,
    };
  }

  static toAddJobRoleResponseDto(
    role: JobRole & { band: Band; capability: Capability; status: Status },
  ): AddJobRoleResponseDto {
    return {
      id: role.id,
      roleName: role.roleName,
      location: role.location,
      status: role.status.statusName,
      band: role.band.name,
      capability: role.capability.name,
      description: role.description,
      responsibilities: role.responsibilities,
      numberOfOpenPositions: role.numberOfOpenPositions,
      sharepointUrl: role.sharepointUrl,
      closingDate: role.closingDate ? role.closingDate.toISOString() : null,
    };
  }
}
