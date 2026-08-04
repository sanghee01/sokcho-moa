import {
  HOME_TITLE,
  SITE_ALTERNATE_NAMES,
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
} from "@/lib/seo/site-identity";

export function buildSiteStructuredData(siteUrl: string) {
  const homeUrl = new URL("/", siteUrl).toString();
  const organizationId = `${homeUrl}#organization`;
  const websiteId = `${homeUrl}#website`;
  const webpageId = `${homeUrl}#webpage`;
  const logoId = `${homeUrl}#logo`;
  const logoUrl = new URL(SITE_LOGO_PATH, homeUrl).toString();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        url: homeUrl,
        logo: {
          "@id": logoId,
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: homeUrl,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        description: SITE_DESCRIPTION,
        inLanguage: "ko-KR",
        publisher: {
          "@id": organizationId,
        },
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: homeUrl,
        name: HOME_TITLE,
        description: SITE_DESCRIPTION,
        inLanguage: "ko-KR",
        isPartOf: {
          "@id": websiteId,
        },
        about: {
          "@id": organizationId,
        },
        primaryImageOfPage: {
          "@id": logoId,
        },
      },
      {
        "@type": "ImageObject",
        "@id": logoId,
        url: logoUrl,
        contentUrl: logoUrl,
        caption: `${SITE_NAME} 로고`,
        width: 512,
        height: 512,
      },
    ],
  };
}
