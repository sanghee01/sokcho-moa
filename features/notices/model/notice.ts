import { DAY_MS, getSeoulDateParts } from "@/lib/seoul-time";

export const noticeKinds = ["notice", "update"] as const;

export type NoticeKind = (typeof noticeKinds)[number];

export const noticeKindLabels: Record<NoticeKind, string> = {
  notice: "공지",
  update: "업데이트",
};

export function isNoticeKind(value: string | undefined): value is NoticeKind {
  return noticeKinds.some((kind) => kind === value);
}

/** 방문자에게 보이는 공지. 공개한 글만 이 타입으로 만든다. */
export interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  /** 처음 공개한 시각(ISO) */
  publishedAt: string;
}

/** 새 글을 상단 배너로 알리는 기간(2026-11-21 사용자 결정). 지나면 배너만 내리고 글은 공지 목록에 남는다. */
export const NOTICE_BANNER_DAYS = 14;

/** 상단 배너로 알릴 글: 공개한 지 NOTICE_BANNER_DAYS가 지나지 않은 글 가운데 가장 최근 것. 없으면 null. */
export function selectBannerNotice(notices: readonly Notice[], now = new Date()): Notice | null {
  const cutoffMs = now.getTime() - NOTICE_BANNER_DAYS * DAY_MS;
  let latest: Notice | null = null;
  for (const notice of notices) {
    const publishedMs = Date.parse(notice.publishedAt);
    if (Number.isNaN(publishedMs) || publishedMs > now.getTime() || publishedMs <= cutoffMs) continue;
    if (latest === null || publishedMs > Date.parse(latest.publishedAt)) latest = notice;
  }
  return latest;
}

/** 방문자가 닫은 배너의 공지 id를 브라우저에 적어 두는 이름. 닫은 글은 그 기기에서 다시 뜨지 않는다. */
export const DISMISSED_NOTICE_STORAGE_KEY = "sokchomoa:dismissed-notice";

/** 공지 날짜 표기 "2026.11.21". 서버와 브라우저의 시간대가 달라도 같도록 서울 날짜로 만든다. */
export function formatNoticeDate(publishedAt: string) {
  const { year, month, day } = getSeoulDateParts(new Date(publishedAt));
  return `${year}.${month}.${day}`;
}

export const NOTICE_LIST_PATH = "/notices";

/** 공지 한 편의 주소. 글마다 주소가 있어야 공유하고 검색에 걸리고, 공지 띠에서 그 글로 바로 간다. */
export function noticePath(id: string) {
  return `${NOTICE_LIST_PATH}/${id}`;
}

/** 목록·검색 결과에 쓰는 본문 첫 부분. 줄바꿈을 공백으로 바꿔 한 덩어리로 만든다. */
export function summarizeNoticeBody(body: string, maxLength = 80) {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}
