import type { JobRoleAllResponseDto } from "../Dto/JobRoleDto";
import type { JobRoleGetAllSelectPayload } from "../models/JobRole";

export class JobRoleMapper {
  private constructor() {}

  static toAllResponseDto(role: JobRoleGetAllSelectPayload): JobRoleAllResponseDto {
    return {
      roleName: role.roleName,
      location: role.location,
      capability: role.capability.name,
      band: role.band.name,
      closingDate: role.closingDate ? role.closingDate.toISOString() : null,
    };
  }
}
