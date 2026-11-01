import { apiFetch } from "./client";

export const BOOKING_STATUSES = [
  "requested",
  "awaiting_payment",
  "confirmed",
  "declined",
  "cancelled",
  "expired",
  "completed",
  "no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface BookingParticipant {
  id: string;
  firstName: string | null;
  lastName: string | null;
  timezone: string;
}

export interface BookingOffering {
  id: string;
  title: string;
  description: string | null;
  type: "one_to_one" | "group";
  durationMinutes: number;
  capacity: number;
  isFree: boolean;
  priceMinor: number;
  currency: string;
}

export interface BookingSession {
  id: string;
  offeringId: string;
  mentorId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: string;
  meetingUrl: string | null;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  message: string | null;
  requestedAt: string;
  respondedAt: string | null;
  expiresAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: "mentee" | "mentor" | null;
  cancelReason: string | null;
  completedAt: string | null;
  noShowParty: "mentee" | "mentor" | null;
  paymentRequired: boolean;
  priceMinor: number;
  currency: string;
  session: BookingSession;
  offering: BookingOffering;
  mentor: BookingParticipant;
  mentee: BookingParticipant;
  createdAt: string;
  updatedAt: string;
}

export interface BookingsResponse {
  items: Booking[];
  nextCursor: string | null;
}

export interface BookingsQuery {
  status?: BookingStatus;
  limit?: number;
  cursor?: string;
}

export interface CreateBookingInput {
  offeringId: string;
  startsAt: string;
  message?: string | null;
}

export function createBooking(input: CreateBookingInput): Promise<Booking> {
  return apiFetch<Booking>("/bookings", {
    method: "POST",
    json: input,
  });
}

export function listBookings(
  query: BookingsQuery = {},
  signal?: AbortSignal,
): Promise<BookingsResponse> {
  const search = new URLSearchParams();

  if (query.status) {
    search.set("status", query.status);
  }

  if (query.limit !== undefined) {
    search.set("limit", String(query.limit));
  }

  if (query.cursor) {
    search.set("cursor", query.cursor);
  }

  const suffix = search.toString();

  return apiFetch<BookingsResponse>(`/bookings${suffix ? `?${suffix}` : ""}`, {
    signal,
  });
}

export function getBooking(id: string, signal?: AbortSignal): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${encodeURIComponent(id)}`, { signal });
}

export function acceptBooking(
  id: string,
  meetingUrl?: string,
): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${encodeURIComponent(id)}/accept`, {
    method: "POST",
    json: meetingUrl ? { meetingUrl } : {},
  });
}

export function declineBooking(id: string, reason?: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${encodeURIComponent(id)}/decline`, {
    method: "POST",
    json: reason ? { reason } : {},
  });
}

export function cancelBooking(id: string, reason?: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    json: reason ? { reason } : {},
  });
}

export function completeBooking(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${encodeURIComponent(id)}/complete`, {
    method: "POST",
  });
}

export function noShowBooking(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${encodeURIComponent(id)}/no-show`, {
    method: "POST",
  });
}
