import { describe, expect, it } from "vitest";
import { noticeFormSchema } from "@/features/notices/admin/schemas";
import { mapNoticeRow } from "@/features/notices/mappers";
import { formatNoticeDate, selectBannerNotice, type Notice } from "@/features/notices/model/notice";

const NOW = new Date("2026-11-21T03:00:00.000Z");

function makeNotice(overrides: Partial<Notice> = {}): Notice {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "notice",
    title: "공지",
    body: "본문",
    publishedAt: "2026-11-20T03:00:00.000Z",
    ...overrides,
  };
}

// 상단 배너: 공개한 지 14일이 지나지 않은 글 가운데 가장 최근 것 하나.
describe("selectBannerNotice", () => {
  it("14일이 지나지 않은 글 가운데 가장 최근 글을 고른다", () => {
    const older = makeNotice({ id: "00000000-0000-4000-8000-000000000001", publishedAt: "2026-11-10T03:00:00.000Z" });
    const newer = makeNotice({ id: "00000000-0000-4000-8000-000000000002", publishedAt: "2026-11-19T03:00:00.000Z" });
    expect(selectBannerNotice([older, newer], NOW)?.id).toBe(newer.id);
    expect(selectBannerNotice([newer, older], NOW)?.id).toBe(newer.id);
  });

  it("공개한 지 정확히 14일이 되면 배너를 내린다", () => {
    expect(selectBannerNotice([makeNotice({ publishedAt: "2026-11-07T03:00:00.001Z" })], NOW)).not.toBeNull();
    expect(selectBannerNotice([makeNotice({ publishedAt: "2026-11-07T03:00:00.000Z" })], NOW)).toBeNull();
  });

  it("공개 시각이 앞으로 잡힌 글과 읽을 수 없는 시각은 고르지 않는다", () => {
    expect(selectBannerNotice([makeNotice({ publishedAt: "2026-11-22T03:00:00.000Z" })], NOW)).toBeNull();
    expect(selectBannerNotice([makeNotice({ publishedAt: "모름" })], NOW)).toBeNull();
  });

  it("공지가 없으면 null이다", () => {
    expect(selectBannerNotice([], NOW)).toBeNull();
  });
});

describe("formatNoticeDate", () => {
  it("UTC로는 전날이어도 서울 날짜로 적는다", () => {
    expect(formatNoticeDate("2026-11-20T15:00:00.000Z")).toBe("2026.11.21");
    expect(formatNoticeDate("2026-11-20T14:59:59.000Z")).toBe("2026.11.20");
  });
});

describe("mapNoticeRow", () => {
  const row = {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "update",
    title: "제목",
    body: "본문",
    is_published: true,
    published_at: "2026-11-20T03:00:00.000Z",
    created_at: "2026-11-20T03:00:00.000Z",
    updated_at: "2026-11-20T03:00:00.000Z",
  };

  it("공개한 행을 화면용 공지로 바꾼다", () => {
    expect(mapNoticeRow(row)).toEqual({ id: row.id, kind: "update", title: "제목", body: "본문", publishedAt: row.published_at });
  });

  it("공개 시각이 없거나 모르는 종류면 버린다", () => {
    expect(mapNoticeRow({ ...row, published_at: null })).toBeNull();
    expect(mapNoticeRow({ ...row, kind: "event" })).toBeNull();
  });
});

describe("noticeFormSchema", () => {
  const input = { kind: "notice", title: " 제목 ", body: " 본문 ", isPublished: true };

  it("앞뒤 공백을 지우고 받는다", () => {
    expect(noticeFormSchema.parse(input)).toMatchObject({ title: "제목", body: "본문" });
  });

  it("빈 제목·모르는 종류·너무 긴 제목은 거부한다", () => {
    expect(noticeFormSchema.safeParse({ ...input, title: "   " }).success).toBe(false);
    expect(noticeFormSchema.safeParse({ ...input, kind: "event" }).success).toBe(false);
    expect(noticeFormSchema.safeParse({ ...input, title: "가".repeat(121) }).success).toBe(false);
  });
});

describe("summarizeNoticeBody", () => {
  it("줄바꿈을 공백으로 합치고 길면 자른다", async () => {
    const { summarizeNoticeBody } = await import("@/features/notices/model/notice");
    expect(summarizeNoticeBody("첫 줄\n\n둘째   줄")).toBe("첫 줄 둘째 줄");
    expect(summarizeNoticeBody("가".repeat(90), 80)).toBe(`${"가".repeat(80)}…`);
  });
});
