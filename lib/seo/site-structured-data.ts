const siteName = "속초모아";
const englishSiteName = "Sokcho Moa";

export function buildSiteStructuredData(siteUrl: string) {
  const homeUrl = new URL("/", siteUrl).toString();
  const organizationId = `${homeUrl}#organization`;
  const websiteId = `${homeUrl}#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteName,
        alternateName: englishSiteName,
        url: homeUrl,
        logo: {
          "@type": "ImageObject",
          url: new URL("/icon.jpeg", homeUrl).toString(),
          width: 512,
          height: 512,
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: homeUrl,
        name: siteName,
        alternateName: [englishSiteName],
        description: "속초의 행사·공연·축제·체험·교육 프로그램을 한곳에서 비교하세요.",
        inLanguage: "ko-KR",
        publisher: {
          "@id": organizationId,
        },
      },
    ],
  };
}
