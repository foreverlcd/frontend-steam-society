import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
