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
  /** True once the user opened the link we emailed (ADR-024). */
  emailVerified: boolean;
  /** True when an authenticator app is enrolled and confirmed. */
  mfaEnabled: boolean;
}

/** POST /auth/login answers with the user, or asks for the second factor. */
export type LoginResponse = AuthUser | { mfaRequired: true };

/** A 6-digit authenticator code or a one-time recovery code. */
export type SecondFactorInput = { code: string } | { recoveryCode: string };

export interface MfaStatus {
  enabled: boolean;
  /** The role cannot turn 2FA off (admins). */
  required: boolean;
  recoveryCodesRemaining: number;
}

export interface TotpSetup {
  /** Base32 key for manual entry in the authenticator app. */
  secret: string;
  /** otpauth:// link that opens the authenticator app on the phone. */
  otpauthUri: string;
}

export interface RecoveryCodesResponse {
  recoveryCodes: string[];
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

/** One signed-in browser or device (GET /me/sessions). */
export interface ActiveSession {
  /** Public id: a hash, never the session cookie. */
  id: string;
  /** The browser making this request. */
  current: boolean;
  signedInAt: string | null;
  lastActiveAt: string;
  userAgent: string | null;
}

/** Proof that the person at the keyboard owns the account. */
export interface StepUpProof {
  password: string;
  /** 6-digit authenticator code; only when the account has 2FA. */
  code?: string;
}
