import type { UserRole } from "@/entities/user/model/user-role";

export type LoginRequestBody = {
  login: string;
  password: string;
};

export type LoginResponseBody = {
  access_token: string;
};

export type JwtPayload = {
  sub: string;
  role: UserRole;
  email?: string;
};

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
  email?: string;
};

export type PublicRegisterBody = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
};

export type CreateUserRequestBody = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
};
