import type { MetadataRoute } from "next";
import {
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
} from "@/lib/seo/site-identity";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    lang: "ko-KR",
    icons: [
      {
        src: SITE_LOGO_PATH,
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
