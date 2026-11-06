import { describe, expect, it, vi } from "vitest";
import { eventBrowsePath } from "@/features/events/model/browse-url";

const redirect = vi.hoisted(() => vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { url });
}));
vi.mock("next/navigation", () => ({ redirect }));

import CalendarPage from "@/app/calendar/page";

async function redirectTarget(params: Record<string, string>) {
  await CalendarPage({ searchParams: Promise.resolve(params) }).catch(() => {});
  return redirect.mock.calls.at(-1)?.[0];
}

describe("삭제된 /calendar 북마크 redirect", () => {
  it("같은 필터를 유지한 채 사이트 안의 목록으로 보낸다", async () => {
    expect(await redirectTarget({ category: "festival", view: "month", month: "2026-07" })).toBe("/?category=festival");
  });

  it.each(["//evil.example", "/\\evil.example", "https://evil.example"])(
    "사용자가 넣은 이동 경로 %s로는 외부 사이트에 보내지 않는다",
    async (target) => {
      const href = await redirectTarget({ __browsePath: target });
      expect(href).toBe("/");
    },
  );
});

describe("eventBrowsePath", () => {
  it.each(["//evil.example", "/\\evil.example", "https://evil.example", "evil"])("%s는 사이트 안 경로가 아니므로 /로 바꾼다", (value) => {
    expect(eventBrowsePath({ __browsePath: value })).toBe("/");
  });

  it("사이트 안 경로는 그대로 쓴다", () => {
    expect(eventBrowsePath({ __browsePath: "/topics/festival" })).toBe("/topics/festival");
  });
});
