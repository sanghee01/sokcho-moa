import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({ default: () => null }));

import { EventBrowseSkeleton } from "@/components/event-browse-skeleton";

describe("event browse loading boundary", () => {
  it("홈과 주제 경로에만 행사 탐색 스켈레톤을 적용한다", () => {
    expect(existsSync(resolve(process.cwd(), "app/loading.tsx"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "app/(event-browse)/loading.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "app/(event-browse)/page.tsx"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "app/(event-browse)/topics/[topic]/page.tsx"))).toBe(true);
  });

  it("실제 화면과 같은 배너·컨트롤·카드 레이아웃을 유지한다", () => {
    const html = renderToStaticMarkup(EventBrowseSkeleton());

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain("data-event-hero-frame");
    expect(html).toContain("h-[10.8rem]");
    expect(html).toContain("xl:grid-cols-[minmax(0,1fr)_minmax(18rem,23rem)_auto]");
    expect(html).toContain("md:grid-cols-2 lg:grid-cols-3");
    expect(html).toContain("aspect-[16/9]");
    expect(html).toContain("gap-3 p-5");
    expect(html.match(/data-event-card-skeleton/g)).toHaveLength(6);
  });

  it("배너 프레임을 실제 화면과 스켈레톤이 함께 사용한다", () => {
    const browsePage = readFileSync(
      resolve(process.cwd(), "components/event-browse-page.tsx"),
      "utf8",
    );
    const skeleton = readFileSync(
      resolve(process.cwd(), "components/event-browse-skeleton.tsx"),
      "utf8",
    );

    expect(browsePage).toContain("<EventHeroFrame");
    expect(skeleton).toContain("<EventHeroFrame");
  });
});
