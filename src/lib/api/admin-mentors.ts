import { apiFetch } from "./client";
import type { OnboardingData } from "./onboarding";
import type { UserStatus } from "./types";

export const MENTOR_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "suspended",
] as const;

export type MentorStatus = (typeof MENTOR_STATUSES)[number];

export interface AdminMentorArea {
  id: string;
  name: string;
  parentId: string | null;
}

export interface AdminMentorLanguage {
  code: string;
  name: string;
}

export interface AdminMentor {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userStatus: UserStatus;
  headline: string | null;
  bio: string | null;
  yearsExperience: number | null;
  country: string | null;
  city: string | null;
  status: MentorStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
  areas: AdminMentorArea[];
  languages: AdminMentorLanguage[];
}

export interface AdminMentorDetailMentor extends AdminMentor {
  minNoticeHours: number;
  maxAdvanceDays: number;
}

export interface AdminMentorDetail {
  mentor: AdminMentorDetailMentor;
  onboarding: OnboardingData;
}

export interface AdminMentorsResponse {
  items: AdminMentor[];
  nextCursor: string | null;
}

export interface AdminMentorsQuery {
  status?: MentorStatus;
  limit?: number;
  cursor?: string;
}

export interface MentorProfile {
  userId: string;
  headline: string | null;
  bio: string | null;
  yearsExperience: number | null;
  country: string | null;
  city: string | null;
  status: MentorStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
  minNoticeHours: number;
  maxAdvanceDays: number;
  areas: AdminMentorArea[];
  languages: AdminMentorLanguage[];
}

export interface MentorActionResponse {
  role: "mentor";
  profile: MentorProfile;
}

export function listAdminMentors(
  query: AdminMentorsQuery = {},
  signal?: AbortSignal,
): Promise<AdminMentorsResponse> {
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

  return apiFetch<AdminMentorsResponse>(
    `/admin/mentors${suffix ? `?${suffix}` : ""}`,
    { signal },
  );
}

export function getAdminMentor(
  id: string,
  signal?: AbortSignal,
): Promise<AdminMentorDetail> {
  return apiFetch<AdminMentorDetail>(
    `/admin/mentors/${encodeURIComponent(id)}`,
    { signal },
  );
}

export function approveMentor(id: string): Promise<MentorActionResponse> {
  return apiFetch<MentorActionResponse>(
    `/admin/mentors/${encodeURIComponent(id)}/approve`,
    { method: "POST" },
  );
}

export function rejectMentor(
  id: string,
  reason: string,
): Promise<MentorActionResponse> {
  return apiFetch<MentorActionResponse>(
    `/admin/mentors/${encodeURIComponent(id)}/reject`,
    { method: "POST", json: { reason } },
  );
}

export function suspendMentor(id: string): Promise<MentorActionResponse> {
  return apiFetch<MentorActionResponse>(
    `/admin/mentors/${encodeURIComponent(id)}/suspend`,
    { method: "POST" },
  );
}

export function reactivateMentor(id: string): Promise<MentorActionResponse> {
  return apiFetch<MentorActionResponse>(
    `/admin/mentors/${encodeURIComponent(id)}/reactivate`,
    { method: "POST" },
  );
}
