import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";

describe("home metadata", () => {
  it("publishes canonical, Open Graph, and Twitter metadata", () => {
    expect(metadata.title).toMatchObject({ default: "속초모아 | 요즘 속초에서 뭐 하지?" });
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "ko_KR",
      url: "/",
      siteName: "속초모아",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.icons).toMatchObject({
      icon: [{ url: "/icon.jpeg", type: "image/jpeg" }],
      shortcut: "/icon.jpeg",
    });
  });
});
