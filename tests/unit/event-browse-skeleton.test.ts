import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({ default: () => null }));

import { EventBrowseSkeleton } from "@/features/events/components/event-browse-skeleton";

describe("event browse loading boundary", () => {
  it("불러오는 중임을 알리고 배너와 카드 6개 자리를 그린다", () => {
    const html = renderToStaticMarkup(EventBrowseSkeleton());

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain("data-event-hero-frame");
    expect(html.match(/data-event-card-skeleton/g)).toHaveLength(6);
  });
});
