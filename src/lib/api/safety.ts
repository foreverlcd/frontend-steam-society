import { apiFetch } from "./client";

export const REPORT_REASONS = [
  "harassment",
  "inappropriate_content",
  "spam_or_fraud",
  "safety_concern",
  "no_show",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  harassment: "Acoso o trato irrespetuoso",
  inappropriate_content: "Contenido o lenguaje inapropiado",
  spam_or_fraud: "Spam, estafa o pedido de dinero",
  safety_concern: "Me sentí en riesgo",
  no_show: "No se presentó a la sesión",
  other: "Otro motivo",
};

export interface BlockedUser {
  userId: string;
  name: string;
  role: "mentee" | "mentor";
  blockedAt: string;
}

export interface CreateReportInput {
  reportedUserId: string;
  bookingId?: string;
  reason: ReportReason;
  details?: string;
}

export function createReport(
  input: CreateReportInput,
): Promise<{ id: string; status: "open" }> {
  return apiFetch("/reports", { method: "POST", json: input });
}

export function blockUser(
  userId: string,
): Promise<{ blockedUserId: string; cancelledBookings: number }> {
  return apiFetch("/me/blocks", { method: "POST", json: { userId } });
}

export function unblockUser(userId: string): Promise<void> {
  return apiFetch(`/me/blocks/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export function listBlocks(signal?: AbortSignal): Promise<BlockedUser[]> {
  return apiFetch<BlockedUser[]>("/me/blocks", { signal });
}
