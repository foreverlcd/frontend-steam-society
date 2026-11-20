import { apiFetch } from "./client";
import type {
  AuthUser,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  LoginInput,
  LoginResponse,
  RegisterInput,
  ResetPasswordInput,
  SecondFactorInput,
} from "./types";

export function register(input: RegisterInput): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/register", {
    method: "POST",
    json: input,
  });
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    json: input,
  });
}

/** Second step of the login when the account has 2FA. */
export function loginWithSecondFactor(
  input: SecondFactorInput,
): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/login/mfa", {
    method: "POST",
    json: input,
  });
}

export function verifyEmail(token: string): Promise<void> {
  return apiFetch<void>("/auth/email/verify", {
    method: "POST",
    json: { token },
  });
}

export function resendEmailVerification(): Promise<void> {
  return apiFetch<void>("/auth/email/resend", { method: "POST" });
}

/** The parent or guardian authorizes from the e-mailed link (public). */
export function confirmGuardianConsent(token: string): Promise<void> {
  return apiFetch<void>("/auth/guardian-consent/confirm", {
    method: "POST",
    json: { token },
  });
}

/** New link for the adult; `guardianEmail` corrects the address. */
export function resendGuardianConsent(guardianEmail?: string): Promise<void> {
  return apiFetch<void>("/me/guardian-consent/resend", {
    method: "POST",
    json: guardianEmail ? { guardianEmail } : {},
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
