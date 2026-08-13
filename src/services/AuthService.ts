import { type PrismaClient, Role, type User } from "@prisma/client";
import argon2 from "argon2";
import { ZodError } from "zod";
import type { LoginRequestDto, RegisterRequestDto } from "../Dto/AuthDTO";
import { signToken } from "../lib/jwt";

export interface LoginResult {
  token: string;
  user: User;
}

export class AuthService {
  constructor(private readonly prismaClient: PrismaClient) {}

  async register(data: RegisterRequestDto): Promise<User> {
    const existingUser = await this.prismaClient.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ZodError([
        {
          code: "custom",
          path: ["email"],
          message: "Email is already registered",
          input: data.email,
        },
      ]);
    }

    const passwordHash = await argon2.hash(data.password);
    return await this.prismaClient.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: Role.USER,
      },
    });
  }

  async login(data: LoginRequestDto): Promise<LoginResult | null> {
    const user = await this.prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await argon2.verify(user.passwordHash, data.password))) {
      return null;
    }

    return {
      token: signToken({ sub: user.id, email: user.email, role: user.role }),
      user,
    };
  }
}
