import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/auth", "/auth/", "/api", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
