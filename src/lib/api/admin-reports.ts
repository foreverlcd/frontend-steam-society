import { buildQuery } from "./admin";
import type { BookingStatus } from "./bookings";
import { apiFetch } from "./client";
import type { UserRole, UserStatus } from "./types";

export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_REASONS = [
  "harassment",
  "inappropriate_content",
  "spam_or_fraud",
  "safety_concern",
  "no_show",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** What the moderator chose when closing the report. */
export type ReportAction = "none" | "warned" | "suspended";

/** What the moderator asks for when resolving a report. */
export type ResolveReportAction = "dismiss" | "warn" | "suspend";

export interface ReportPerson {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface ReportSummary {
  id: string;
  reason: ReportReason;
  status: ReportStatus;
  createdAt: string;
  bookingId: string | null;
  reporter: ReportPerson;
  reportedUser: ReportPerson;
}

export interface ReportsResponse {
  items: ReportSummary[];
  nextCursor: string | null;
}

export interface ReportsQuery {
  status?: ReportStatus;
  limit?: number;
  cursor?: string;
}

export interface ReportDetail {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  action: ReportAction | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: ReportPerson | null;
  reporter: ReportPerson;
  reportedUser: ReportPerson & { reportsTotal: number; reportsOpen: number };
  booking: {
    id: string;
    status: BookingStatus;
    offeringTitle: string;
    startsAt: string;
  } | null;
}

export interface SuspendUserResponse {
  userId: string;
  status: "suspended";
  cancelledBookings: number;
}

export interface ReactivateUserResponse {
  userId: string;
  status: "active";
}

export function listReports(
  query: ReportsQuery = {},
  signal?: AbortSignal,
): Promise<ReportsResponse> {
  return apiFetch<ReportsResponse>(
    `/admin/reports${buildQuery({
      status: query.status,
      limit: query.limit,
      cursor: query.cursor,
    })}`,
    { signal },
  );
}

export function getReport(
  id: string,
  signal?: AbortSignal,
): Promise<ReportDetail> {
  return apiFetch<ReportDetail>(`/admin/reports/${encodeURIComponent(id)}`, {
    signal,
  });
}

export function resolveReport(
  id: string,
  input: { action: ResolveReportAction; note: string },
): Promise<ReportDetail> {
  return apiFetch<ReportDetail>(
    `/admin/reports/${encodeURIComponent(id)}/resolve`,
    { method: "POST", json: input },
  );
}

export function suspendUser(
  id: string,
  reason: string,
): Promise<SuspendUserResponse> {
  return apiFetch<SuspendUserResponse>(
    `/admin/users/${encodeURIComponent(id)}/suspend`,
    { method: "POST", json: { reason } },
  );
}

export function reactivateUser(id: string): Promise<ReactivateUserResponse> {
  return apiFetch<ReactivateUserResponse>(
    `/admin/users/${encodeURIComponent(id)}/reactivate`,
    { method: "POST" },
  );
}
