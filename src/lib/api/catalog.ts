import { apiFetch } from "./client";

export interface CatalogArea {
  id: string;
  name: string;
  parentId: string | null;
}

export interface CatalogLanguage {
  code: string;
  name: string;
}

export interface CatalogOffering {
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

export interface CatalogMentor {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  bio: string | null;
  yearsExperience: number | null;
  country: string | null;
  city: string | null;
  areas: CatalogArea[];
  languages: CatalogLanguage[];
  offerings: CatalogOffering[];
}

export interface CatalogPage {
  items: CatalogMentor[];
  nextCursor: string | null;
}

export interface CatalogQuery {
  q?: string;
  areaId?: string;
  language?: string;
  country?: string;
  isFree?: boolean;
  maxPriceMinor?: number;
  currency?: string;
  limit?: number;
  cursor?: string;
}

export interface RecommendationOffering {
  id: string;
  title: string;
  isFree: boolean;
  priceMinor: number;
  currency: string;
  durationMinutes: number;
}

export interface RecommendationMentor {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  bio: string | null;
  yearsExperience: number | null;
  country: string | null;
  city: string | null;
  areas: CatalogArea[];
  languages: CatalogLanguage[];
  offerings: RecommendationOffering[];
}

export type RecommendationSignal =
  | "areas"
  | "availability"
  | "language"
  | "level_fit"
  | "price_fit"
  | "reliability";

export interface RecommendationBreakdown {
  signal: RecommendationSignal;
  points: number;
  max: number;
  detail: string;
}

export interface Recommendation {
  mentorId: string;
  mentor: RecommendationMentor;
  score: number;
  breakdown: RecommendationBreakdown[];
  reason: string;
}

export interface RecommendationsResponse {
  items: Recommendation[];
  meta: {
    totalCandidates: number;
    eligibleCandidates: number;
    horizonDays: number;
    limit: number;
  };
}

export function listMentors(
  query: CatalogQuery = {},
  signal?: AbortSignal,
): Promise<CatalogPage> {
  const search = new URLSearchParams();

  if (query.q) {
    search.set("q", query.q);
  }

  if (query.areaId) {
    search.set("areaId", query.areaId);
  }

  if (query.language) {
    search.set("language", query.language);
  }

  if (query.country) {
    search.set("country", query.country);
  }

  if (query.isFree !== undefined) {
    search.set("isFree", String(query.isFree));
  }

  if (query.maxPriceMinor !== undefined) {
    search.set("maxPriceMinor", String(query.maxPriceMinor));
  }

  if (query.currency) {
    search.set("currency", query.currency);
  }

  if (query.limit !== undefined) {
    search.set("limit", String(query.limit));
  }

  if (query.cursor) {
    search.set("cursor", query.cursor);
  }

  const suffix = search.toString();

  return apiFetch<CatalogPage>(`/mentors${suffix ? `?${suffix}` : ""}`, {
    signal,
  });
}

export function getMentor(
  id: string,
  signal?: AbortSignal,
): Promise<CatalogMentor> {
  return apiFetch<CatalogMentor>(`/mentors/${encodeURIComponent(id)}`, {
    signal,
  });
}

export function getRecommendations(
  limit?: number,
  signal?: AbortSignal,
): Promise<RecommendationsResponse> {
  const suffix = limit === undefined ? "" : `?limit=${limit}`;

  return apiFetch<RecommendationsResponse>(`/me/recommendations${suffix}`, {
    signal,
  });
}
