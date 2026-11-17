import { apiFetch } from "./client";
import type { MfaStatus, RecoveryCodesResponse, TotpSetup } from "./types";

export function getMfaStatus(signal?: AbortSignal): Promise<MfaStatus> {
  return apiFetch<MfaStatus>("/me/mfa", { signal });
}

export function startTotpSetup(): Promise<TotpSetup> {
  return apiFetch<TotpSetup>("/me/mfa/totp/setup", { method: "POST" });
}

/** Confirms the setup; the recovery codes are shown only this once. */
export function confirmTotpSetup(code: string): Promise<RecoveryCodesResponse> {
  return apiFetch<RecoveryCodesResponse>("/me/mfa/totp/confirm", {
    method: "POST",
    json: { code },
  });
}

export function regenerateRecoveryCodes(
  code: string,
): Promise<RecoveryCodesResponse> {
  return apiFetch<RecoveryCodesResponse>("/me/mfa/recovery-codes", {
    method: "POST",
    json: { code },
  });
}

export function disableMfa(input: {
  password: string;
  code: string;
}): Promise<void> {
  return apiFetch<void>("/me/mfa/disable", { method: "POST", json: input });
}
