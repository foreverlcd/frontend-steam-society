import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Private app routes; public pages and the mentor catalog stay crawlable. */
const PRIVATE_PATHS = [
  "/dashboard",
  "/admin",
  "/account",
  "/onboarding",
  "/call",
  "/payments",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

/**
 * AI assistants and AI search crawlers are explicitly welcome on the public
 * pages (GEO): being cited by them is how many people will find the platform.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "MistralAI-User",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
