import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { CROP_CATEGORIES, MARKET_CITIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const cityEntries: MetadataRoute.Sitemap = MARKET_CITIES.map((city) => ({
    url: `${baseUrl}/?city=${encodeURIComponent(city)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: city === "القضارف" ? 0.9 : 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = CROP_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/?category=${encodeURIComponent(cat)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.75,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...cityEntries,
    ...categoryEntries,
  ];
}
