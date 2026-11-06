import { describe, expect, it } from "vitest";
import { createEventSlug, eventSavedRedirect } from "@/features/events/admin/event-payload";
import { adminResultHref, getAdminResultMessage } from "@/components/admin/admin-result";

describe("administrator event write helpers", () => {
  it("작성자가 입력하지 않아도 URL 규칙에 맞는 시스템 slug를 만든다", () => {
    expect(createEventSlug("ABCDEF12-3456-4789-ABCD-EF1234567890")).toBe("event-abcdef12-3456-4789-abcd-ef1234567890");
  });

  it("기본 생성 slug가 서로 다르고 허용 형식에 맞는다", () => {
    const slugs = Array.from({ length: 20 }, () => createEventSlug());

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("저장 후 이동한 대시보드가 작성과 수정에 서로 다른 완료 메시지를 보여 준다", () => {
    // action이 만드는 redirect 주소와 대시보드가 읽는 query 이름이 어긋나면 메시지가 조용히 사라진다.
    function feedbackAfter(isEditing: boolean) {
      const url = new URL(eventSavedRedirect(isEditing), "https://sokcho-moa.test");
      expect(url.pathname).toBe("/admin");
      return getAdminResultMessage(url.searchParams.get("result") ?? undefined);
    }

    expect(feedbackAfter(false)).toBeDefined();
    expect(feedbackAfter(true)).toBeDefined();
    expect(feedbackAfter(false)).not.toBe(feedbackAfter(true));
  });

  it("결과 안내 주소는 기존 query를 지키고 result 하나로 결과를 전한다", () => {
    const url = new URL(adminResultHref("/admin?tab=places", "place-deleted"), "https://sokcho-moa.test");
    expect(url.searchParams.get("tab")).toBe("places");
    expect(getAdminResultMessage(url.searchParams.get("result") ?? undefined)).toBeDefined();
    expect(getAdminResultMessage("unknown")).toBeUndefined();
  });

});
