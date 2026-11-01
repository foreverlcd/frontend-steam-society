import { apiFetch } from "./client";

export interface ProfileArea {
  id: string;
  name: string;
  parentId: string | null;
}

export interface ProfileLanguage {
  code: string;
  name: string;
}

export interface MentorProfile {
  userId: string;
  headline: string | null;
  bio: string | null;
  yearsExperience: number | null;
  country: string | null;
  city: string | null;
  status: "draft" | "pending_review" | "approved" | "rejected" | "suspended";
  reviewedAt: string | null;
  rejectionReason: string | null;
  minNoticeHours: number;
  maxAdvanceDays: number;
  areas: ProfileArea[];
  languages: ProfileLanguage[];
}

export interface MenteeProfile {
  userId: string;
  goals: string | null;
  educationLevel:
    "school" | "undergraduate" | "graduate" | "career_change" | "other" | null;
  careerStage:
    "school" | "preuniversity" | "university" | "early_career" | null;
  country: string | null;
  city: string | null;
  areas: ProfileArea[];
  languages: ProfileLanguage[];
}

export interface ProfileResponse {
  role: "mentor" | "mentee";
  profile: MentorProfile | MenteeProfile | null;
}

export interface MentorProfileUpdateInput {
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  country?: string | null;
  city?: string | null;
  languageCodes?: string[];
  areaIds?: string[];
}

export interface MenteeProfileUpdateInput {
  goals?: string | null;
  educationLevel?: MenteeProfile["educationLevel"];
  careerStage?: MenteeProfile["careerStage"];
  country?: string | null;
  city?: string | null;
  languageCodes?: string[];
  areaIds?: string[];
}

export function getProfile(signal?: AbortSignal): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/me/profile", { signal });
}

export function updateProfile(
  input: MentorProfileUpdateInput | MenteeProfileUpdateInput,
): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/me/profile", {
    method: "PUT",
    json: input,
  });
}

export function submitMentorProfile(): Promise<{
  role: "mentor";
  profile: MentorProfile;
}> {
  return apiFetch<{ role: "mentor"; profile: MentorProfile }>(
    "/me/profile/submit",
    { method: "POST" },
  );
}
