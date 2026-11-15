// RSS 2.0 문서를 만드는 도메인 무관 helper. 어떤 글을 담을지는 각 도메인(예: features/events/rss.ts)이 정한다.

export interface RssItem {
  title: string;
  /** 글의 대표 주소(canonical). guid로도 쓴다. */
  link: string;
  description: string;
  category?: string;
  publishedAt?: Date;
}

export interface RssChannel {
  title: string;
  /** 사이트 홈 주소 */
  link: string;
  description: string;
  /** 이 RSS 파일의 주소. 리더와 검증기가 피드 위치를 확인하는 atom:link rel="self"에 쓴다. */
  selfUrl: string;
  language: string;
  lastBuildDate?: Date;
  items: readonly RssItem[];
}

export function buildRssXml(channel: RssChannel) {
  const items = channel.items.map((item) => [
    "<item>",
    element("title", item.title),
    element("link", item.link),
    `<guid isPermaLink="true">${escapeXml(item.link)}</guid>`,
    element("description", item.description),
    item.category ? element("category", item.category) : "",
    item.publishedAt ? element("pubDate", item.publishedAt.toUTCString()) : "",
    "</item>",
  ].join(""));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    element("title", channel.title),
    element("link", channel.link),
    element("description", channel.description),
    `<atom:link href="${escapeXml(channel.selfUrl)}" rel="self" type="application/rss+xml"/>`,
    element("language", channel.language),
    channel.lastBuildDate ? element("lastBuildDate", channel.lastBuildDate.toUTCString()) : "",
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");
}

function element(name: string, value: string) {
  return `<${name}>${escapeXml(value)}</${name}>`;
}

// XML 1.0은 탭·줄바꿈·CR 외의 제어 문자와 짝 없는 surrogate 등을 허용하지 않는다.
// 수집한 공고 문구에 섞여 들어오면 피드 전체가 깨지므로 뺀다.
function isAllowedXmlCharacter(codePoint: number) {
  if (codePoint === 0x9 || codePoint === 0xa || codePoint === 0xd) return true;
  if (codePoint < 0x20 || codePoint === 0xfffe || codePoint === 0xffff) return false;
  return codePoint < 0xd800 || codePoint > 0xdfff;
}

function escapeXml(value: string) {
  return Array.from(value)
    .filter((character) => isAllowedXmlCharacter(character.codePointAt(0) ?? 0))
    .join("")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}
