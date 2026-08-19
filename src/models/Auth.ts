import type { Role } from "@prisma/client";

export interface AuthTokenPayload {
  sub: number;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}
