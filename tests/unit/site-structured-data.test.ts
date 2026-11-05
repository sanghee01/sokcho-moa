import { describe, expect, it } from "vitest";
import { buildSiteStructuredData } from "@/lib/seo/site-structured-data";

describe("buildSiteStructuredData", () => {
  it("홈페이지의 브랜드와 운영 주체를 같은 엔터티로 연결한다", () => {
    const result = buildSiteStructuredData("https://sokcho-moa.vercel.app");
    const [organization, website, webpage, logo] = result["@graph"];

    expect(result["@context"]).toBe("https://schema.org");
    expect(organization).toMatchObject({
      "@type": "Organization",
      "@id": "https://sokcho-moa.vercel.app/#organization",
      name: "속초모아",
      alternateName: ["속초 모아", "Sokcho Moa"],
      url: "https://sokcho-moa.vercel.app/",
      logo: { "@id": "https://sokcho-moa.vercel.app/#logo" },
    });
    expect(website).toMatchObject({
      "@type": "WebSite",
      "@id": "https://sokcho-moa.vercel.app/#website",
      name: "속초모아",
      alternateName: ["속초 모아", "Sokcho Moa"],
      publisher: { "@id": "https://sokcho-moa.vercel.app/#organization" },
    });
    expect(webpage).toMatchObject({
      "@type": "WebPage",
      "@id": "https://sokcho-moa.vercel.app/#webpage",
      name: "속초모아 | 속초 행사·축제 일정",
      primaryImageOfPage: { "@id": "https://sokcho-moa.vercel.app/#logo" },
    });
    expect(logo).toEqual({
      "@type": "ImageObject",
      "@id": "https://sokcho-moa.vercel.app/#logo",
      url: "https://sokcho-moa.vercel.app/icon.jpeg",
      contentUrl: "https://sokcho-moa.vercel.app/icon.jpeg",
      caption: "속초모아 로고",
      width: 512,
      height: 512,
    });
  });

  it("사이트 URL에 경로가 있어도 홈페이지 기준 절대 URL을 만든다", () => {
    const result = buildSiteStructuredData("https://example.com/preview");

    expect(result["@graph"][0].url).toBe("https://example.com/");
    expect(result["@graph"][1].alternateName).toEqual(["속초 모아", "Sokcho Moa"]);
  });
});
