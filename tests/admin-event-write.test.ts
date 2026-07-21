import { describe, expect, it } from "vitest";
import { createEventSlug, eventSavedRedirect } from "@/lib/admin/event-write";
import { getAdminDashboardFeedback } from "@/lib/admin/dashboard-feedback";

describe("administrator event write helpers", () => {
  it("작성자가 입력하지 않아도 URL 규칙에 맞는 시스템 slug를 만든다", () => {
    expect(createEventSlug("ABCDEF12-3456-4789-ABCD-EF1234567890")).toBe("event-abcdef12-3456-4789-abcd-ef1234567890");
  });

  it("기본 생성 slug가 서로 다르고 허용 형식에 맞는다", () => {
    const slugs = Array.from({ length: 20 }, () => createEventSlug());

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("작성과 수정 완료를 구분해 대시보드로 보낸다", () => {
    expect(eventSavedRedirect(false)).toBe("/admin?saved=event-created");
    expect(eventSavedRedirect(true)).toBe("/admin?saved=event-updated");
    expect(getAdminDashboardFeedback({ saved: "event-created" })).toBe("새 행사를 검수 대기로 등록했습니다.");
    expect(getAdminDashboardFeedback({ saved: "event-updated" })).toBe("행사 정보를 수정했습니다.");
  });

});
