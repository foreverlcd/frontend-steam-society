import type { MentorStatus } from "./admin-mentors";
import type { BookingStatus } from "./bookings";
import { apiFetch } from "./client";
import type { UserRole, UserStatus } from "./types";

/** Statuses an admin can filter people by (deleted accounts are hidden). */
export const ADMIN_USER_STATUSES = [
  "pending_verification",
  "active",
  "suspended",
] as const;

export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];

export interface AdminOverview {
  generatedAt: string;
  /** Counts per role and account status. */
  users: Partial<Record<UserRole, Partial<Record<UserStatus, number>>>>;
  newUsersLast30Days: number;
  mentors: { pendingReview: number; approved: number };
  bookingsLast30Days: Partial<Record<BookingStatus, number>>;
  upcomingConfirmedNext7Days: number;
  openReports: number;
  email: { failedLast7Days: number; pending: number };
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  mentorStatus: MentorStatus | null;
  createdAt: string;
}

export interface AdminUsersResponse {
  items: AdminUserSummary[];
  nextCursor: string | null;
}

export interface AdminUsersQuery {
  q?: string;
  role?: UserRole;
  status?: AdminUserStatus;
  limit?: number;
  cursor?: string;
}

export interface AdminUserHistoryEntry {
  action: string;
  at: string;
  actorName: string | null;
  metadata: unknown;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  timezone: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  mentorStatus: MentorStatus | null;
  createdAt: string;
  bookingsAsMentee: Partial<Record<BookingStatus, number>>;
  bookingsAsMentor: Partial<Record<BookingStatus, number>>;
  reportsAgainst: Partial<Record<"open" | "resolved" | "dismissed", number>>;
  reportsFiled: number;
  blockedByCount: number;
  history: AdminUserHistoryEntry[];
}

export interface AdminBookingPerson {
  id: string;
  name: string;
}

export interface AdminBooking {
  id: string;
  status: BookingStatus;
  requestedAt: string;
  startsAt: string;
  endsAt: string;
  offeringTitle: string;
  mentee: AdminBookingPerson;
  mentor: AdminBookingPerson;
  cancelledBy: string | null;
  cancelReason: string | null;
}

export interface AdminBookingsResponse {
  items: AdminBooking[];
  nextCursor: string | null;
}

export interface AdminBookingsQuery {
  status?: BookingStatus;
  userId?: string;
  /** ISO 8601 datetime, inclusive lower bound on the session start. */
  from?: string;
  /** ISO 8601 datetime, exclusive upper bound on the session start. */
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface AdminCancelBookingResponse {
  id: string;
  status: "cancelled";
}

/** Builds `?a=1&b=2` from defined, non-empty values (empty string when none). */
export function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }

    search.set(key, String(value));
  }

  const suffix = search.toString();

  return suffix ? `?${suffix}` : "";
}

export function getAdminOverview(signal?: AbortSignal): Promise<AdminOverview> {
  return apiFetch<AdminOverview>("/admin/overview", { signal });
}

export function listAdminUsers(
  query: AdminUsersQuery = {},
  signal?: AbortSignal,
): Promise<AdminUsersResponse> {
  return apiFetch<AdminUsersResponse>(
    `/admin/users${buildQuery({
      q: query.q?.trim(),
      role: query.role,
      status: query.status,
      limit: query.limit,
      cursor: query.cursor,
    })}`,
    { signal },
  );
}

export function getAdminUser(
  id: string,
  signal?: AbortSignal,
): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`, {
    signal,
  });
}

export function listAdminBookings(
  query: AdminBookingsQuery = {},
  signal?: AbortSignal,
): Promise<AdminBookingsResponse> {
  return apiFetch<AdminBookingsResponse>(
    `/admin/bookings${buildQuery({
      status: query.status,
      userId: query.userId,
      from: query.from,
      to: query.to,
      limit: query.limit,
      cursor: query.cursor,
    })}`,
    { signal },
  );
}

export function cancelAdminBooking(
  id: string,
  reason: string,
): Promise<AdminCancelBookingResponse> {
  return apiFetch<AdminCancelBookingResponse>(
    `/admin/bookings/${encodeURIComponent(id)}/cancel`,
    { method: "POST", json: { reason } },
  );
}
