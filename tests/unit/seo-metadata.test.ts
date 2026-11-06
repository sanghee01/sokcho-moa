import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";
import {
  feedbackPageMetadata,
  reportPageMetadata,
} from "@/lib/seo/utility-page-metadata";

describe("home metadata", () => {
  it("홈은 검색 색인 대상이고 canonical과 공유 URL이 홈을 가리킨다", () => {
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({ url: "/" });
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
