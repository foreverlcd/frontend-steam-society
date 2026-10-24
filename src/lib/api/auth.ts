import { apiFetch } from "./client";
import type {
  AuthUser,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./types";

export function register(input: RegisterInput): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/register", {
    method: "POST",
    json: input,
  });
}

export function login(input: LoginInput): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/login", {
    method: "POST",
    json: input,
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export function forgotPassword(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>("/auth/password/forgot", {
    method: "POST",
    json: input,
  });
}

export function resetPassword(input: ResetPasswordInput): Promise<void> {
  return apiFetch<void>("/auth/password/reset", {
    method: "POST",
    json: input,
  });
}

export function getMe(signal?: AbortSignal): Promise<AuthUser> {
  return apiFetch<AuthUser>("/me", { signal });
}
