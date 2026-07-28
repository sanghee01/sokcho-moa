import { describe, expect, it } from "vitest";
import { buildSiteStructuredData } from "@/lib/seo/site-structured-data";

describe("buildSiteStructuredData", () => {
  it("홈페이지의 브랜드와 운영 주체를 같은 엔터티로 연결한다", () => {
    const result = buildSiteStructuredData("https://sokcho-moa.vercel.app");

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://sokcho-moa.vercel.app/#organization",
          name: "속초모아",
          alternateName: "Sokcho Moa",
          url: "https://sokcho-moa.vercel.app/",
          logo: {
            "@type": "ImageObject",
            url: "https://sokcho-moa.vercel.app/icon.jpeg",
            width: 512,
            height: 512,
          },
        },
        {
          "@type": "WebSite",
          "@id": "https://sokcho-moa.vercel.app/#website",
          url: "https://sokcho-moa.vercel.app/",
          name: "속초모아",
          alternateName: ["Sokcho Moa", "sokcho-moa.vercel.app"],
          description: "속초의 행사·공연·축제·체험·교육 프로그램을 한곳에서 비교하세요.",
          inLanguage: "ko-KR",
          publisher: {
            "@id": "https://sokcho-moa.vercel.app/#organization",
          },
        },
      ],
    });
  });

  it("사이트 URL에 경로가 있어도 홈페이지 기준 절대 URL을 만든다", () => {
    const result = buildSiteStructuredData("https://example.com/preview");

    expect(result["@graph"][0].url).toBe("https://example.com/");
    expect(result["@graph"][1].alternateName).toContain("example.com");
  });
});
