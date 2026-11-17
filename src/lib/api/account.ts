import { apiFetch } from "./client";
import type { ActiveSession, StepUpProof } from "./types";

export function listSessions(signal?: AbortSignal): Promise<ActiveSession[]> {
  return apiFetch<ActiveSession[]>("/me/sessions", { signal });
}

export function revokeSession(id: string): Promise<void> {
  return apiFetch<void>(`/me/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function revokeOtherSessions(): Promise<{ revoked: number }> {
  return apiFetch<{ revoked: number }>("/me/sessions/revoke-others", {
    method: "POST",
  });
}

export function changePassword(
  input: StepUpProof & { newPassword: string },
): Promise<void> {
  return apiFetch<void>("/me/password", { method: "POST", json: input });
}

/** Sends a confirmation link to the new address; nothing changes until then. */
export function requestEmailChange(
  input: StepUpProof & { newEmail: string },
): Promise<void> {
  return apiFetch<void>("/me/email", { method: "POST", json: input });
}

/** Everything the platform stores about you, as JSON. */
export function exportMyData(): Promise<unknown> {
  return apiFetch<unknown>("/me/export");
}

export function deleteAccount(
  input: StepUpProof & { confirmation: string },
): Promise<void> {
  return apiFetch<void>("/me/delete", { method: "POST", json: input });
}
