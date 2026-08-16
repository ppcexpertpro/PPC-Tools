import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TOOL_ROUTES = [
  "/keyword-match-type",
  "/keyword-merge-match",
  "/negative-keyword-finder",
];

// Listed so they're indexable and discoverable, but weighted well below the
// tools - nobody is searching for these, they're reached from the footer.
const LEGAL_ROUTES = ["/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: siteUrl, lastModified, changeFrequency: "monthly", priority: 1 },
    ...TOOL_ROUTES.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...LEGAL_ROUTES.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
