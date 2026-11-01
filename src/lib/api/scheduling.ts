import { apiFetch } from "./client";

export type OfferingType = "one_to_one" | "group";

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Offering {
  id: string;
  mentorId: string;
  title: string;
  description: string | null;
  type: OfferingType;
  durationMinutes: number;
  capacity: number;
  isFree: boolean;
  priceMinor: number;
  currency: string;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfferingsResponse {
  items: Offering[];
}

export interface CreateOfferingInput {
  title: string;
  description?: string | null;
  durationMinutes: number;
  isFree: boolean;
  priceMinor?: number;
  currency?: string;
}

export interface UpdateOfferingInput {
  title?: string;
  description?: string | null;
  durationMinutes?: number;
  isFree?: boolean;
  priceMinor?: number;
  currency?: string;
}

export interface AvailabilityRule {
  id: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  timezone: string;
  validFrom: string | null;
  validTo: string | null;
}

export interface AvailabilityResponse {
  timezone: string;
  rules: AvailabilityRule[];
}

export interface AvailabilityRuleInput {
  weekday: Weekday;
  startTime: string;
  endTime: string;
  timezone?: string;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface ReplaceAvailabilityInput {
  rules: AvailabilityRuleInput[];
}

export interface Slot {
  startsAt: string;
  endsAt: string;
  timezone: string;
  localStart: string;
  localEnd: string;
}

export interface SlotsResponse {
  mentorId: string;
  offeringId: string;
  durationMinutes: number;
  slots: Slot[];
}

export interface MentorSlotsQuery {
  offeringId: string;
  from: string;
  to: string;
}

export function listOfferings(
  signal?: AbortSignal,
): Promise<OfferingsResponse> {
  return apiFetch<OfferingsResponse>("/me/offerings", { signal });
}

export function createOffering(input: CreateOfferingInput): Promise<Offering> {
  return apiFetch<Offering>("/me/offerings", {
    method: "POST",
    json: input,
  });
}

export function updateOffering(
  id: string,
  input: UpdateOfferingInput,
): Promise<Offering> {
  return apiFetch<Offering>(`/me/offerings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    json: input,
  });
}

export function archiveOffering(id: string): Promise<Offering> {
  return apiFetch<Offering>(`/me/offerings/${encodeURIComponent(id)}/archive`, {
    method: "POST",
  });
}

export function getAvailability(
  signal?: AbortSignal,
): Promise<AvailabilityResponse> {
  return apiFetch<AvailabilityResponse>("/me/availability", { signal });
}

export function replaceAvailability(
  input: ReplaceAvailabilityInput,
): Promise<AvailabilityResponse> {
  return apiFetch<AvailabilityResponse>("/me/availability", {
    method: "PUT",
    json: input,
  });
}

export function getMentorSlots(
  mentorId: string,
  query: MentorSlotsQuery,
  signal?: AbortSignal,
): Promise<SlotsResponse> {
  const search = new URLSearchParams({
    offeringId: query.offeringId,
    from: query.from,
    to: query.to,
  });

  return apiFetch<SlotsResponse>(
    `/mentors/${encodeURIComponent(mentorId)}/slots?${search.toString()}`,
    { signal },
  );
}
