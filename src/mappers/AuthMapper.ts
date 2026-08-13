import type { User } from "@prisma/client";
import type { AuthUserResponseDto } from "../Dto/AuthDTO";

export class AuthMapper {
  private constructor() {}

  static toUserResponseDto(user: User): AuthUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
