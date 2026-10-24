export type UserRole = "mentee" | "mentor" | "admin";

export type UserStatus =
  "pending_verification" | "active" | "suspended" | "deleted";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
}

export type PublicRole = Exclude<UserRole, "admin">;

export interface RegisterInput {
  email: string;
  password: string;
  role: PublicRole;
  birthDate: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface ForgotPasswordResponse {
  status: string;
}
