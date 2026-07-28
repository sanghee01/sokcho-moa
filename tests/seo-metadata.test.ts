import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";
import {
  feedbackPageMetadata,
  reportPageMetadata,
} from "@/lib/seo/utility-page-metadata";

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
