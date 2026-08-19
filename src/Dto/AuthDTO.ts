import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

export const RegisterSchema = z
  .object({
    email: z.email("Email must be a valid email address"),
    password: passwordSchema,
  })
  .strict();

export const LoginSchema = z
  .object({
    email: z.email("Email must be a valid email address"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export type RegisterRequestDto = z.infer<typeof RegisterSchema>;
export type LoginRequestDto = z.infer<typeof LoginSchema>;

export interface AuthUserResponseDto {
  id: number;
  email: string;
  role: string;
}

export interface LoginResponseDto {
  token: string;
  user: AuthUserResponseDto;
}
