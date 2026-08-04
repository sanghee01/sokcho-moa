import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";
import {
  feedbackPageMetadata,
  reportPageMetadata,
} from "@/lib/seo/utility-page-metadata";

describe("home metadata", () => {
  it("publishes canonical, Open Graph, and Twitter metadata", () => {
    expect(metadata.title).toMatchObject({ default: "속초모아 | 속초 행사·축제 일정" });
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.description).toContain("속초모아(속초 모아)");
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: { "max-image-preview": "large" },
    });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "ko_KR",
      url: "/",
      siteName: "속초모아",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.icons).toMatchObject({
      icon: [{ url: "http://localhost:3000/icon.jpeg", type: "image/jpeg", sizes: "512x512" }],
      shortcut: "http://localhost:3000/icon.jpeg",
    });
  });
});

describe("utility page metadata", () => {
  it("제보와 의견 페이지를 검색 색인 대상에서 제외한다", () => {
    expect(reportPageMetadata).toMatchObject({
      alternates: { canonical: "/report" },
      robots: { index: false, follow: true },
    });
    expect(feedbackPageMetadata).toMatchObject({
      alternates: { canonical: "/feedback" },
      robots: { index: false, follow: true },
    });
  });
});
