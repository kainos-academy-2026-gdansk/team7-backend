import type { JobRoleAllResponseDto } from "../Dto/JobRoleDto";
import type { JobRoleWithRelations } from "../models/JobRole";

export class JobRoleMapper {
  private constructor() {}

  static toAllResponseDto(role: JobRoleWithRelations): JobRoleAllResponseDto {
    return {
      roleName: role.roleName,
      location: role.location,
      capability: role.capability.name,
      band: role.band.name,
      closingDate: role.closingDate ? role.closingDate.toISOString() : null,
    };
  }
}
