import { devices, expect, test, type Page } from "@playwright/test";
import { SAMPLE_EVENT_PATH } from "@/tests/e2e/fixtures";

// 화면 폭 기준은 .ai/DESIGN.md의 "반응형 검증"이 원본이다.
// 412px(Pixel 7)와 데스크톱은 playwright 프로젝트로 public-event-flow.spec.ts가 확인하므로,
// 여기서는 프로젝트에 없는 360px(갤럭시 기본 폭)과 768px(태블릿)을 직접 지정한다.
const galaxy = devices["Galaxy S24"];

const viewports = [
  {
    name: "360px 모바일",
    options: {
      viewport: galaxy.viewport,
      userAgent: galaxy.userAgent,
      deviceScaleFactor: galaxy.deviceScaleFactor,
      isMobile: galaxy.isMobile,
      hasTouch: galaxy.hasTouch,
    },
  },
  {
    name: "768px 태블릿",
    options: { viewport: { width: 768, height: 1024 } },
  },
];

// 개편으로 제목 문구가 바뀌어도 깨지지 않게, 화면이 다 그려졌는지는 h1이 보이는지로만 확인한다.
const publicPages = ["/", "/topics/festival", SAMPLE_EVENT_PATH, "/report", "/feedback", "/privacy"];

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
}

for (const { name, options } of viewports) {
  test.describe(name, () => {
    test.use(options);

    for (const path of publicPages) {
      test(`${path} 화면이 가로로 넘치지 않는다`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop-chromium", "화면 폭을 직접 지정하므로 프로젝트마다 반복하지 않는다");

        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

        const widths = await horizontalOverflow(page);
        expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
        expect(widths.body).toBeLessThanOrEqual(widths.viewport + 1);
      });

      // 2026-11-07 사용자 결정: 어느 페이지든 내려도 헤더(로고)가 화면 위에 남아 있어 홈으로 바로 갈 수 있다.
      test(`${path} 아래로 내려도 헤더가 화면 맨 위에 보인다`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop-chromium", "화면 폭을 직접 지정하므로 프로젝트마다 반복하지 않는다");

        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));

        const header = page.getByRole("banner");
        await expect(header.getByRole("link", { name: "속초모아" })).toBeInViewport();
        const box = await header.boundingBox();
        expect(box).not.toBeNull();
        expect(Math.round(box!.y)).toBe(0);
      });
    }
  });
}

test.describe("360×740 첫 화면", () => {
  test.use({ ...viewports[0].options, viewport: { width: 360, height: 740 } });

  // 2026-11-06 사용자 결정: 포스터를 크게 보이도록 2열 포스터 카드로 바꿨다. 그 대가로 한 화면의 행사 수가 줄어서
  // 기준을 "제목 3개"에서 "카드 2개(이미지와 제목)가 끝까지 보임"으로 바꿨다.
  test("홈 첫 화면에 행사 카드가 2개 이상 이미지와 제목까지 보인다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "화면 폭을 직접 지정하므로 프로젝트마다 반복하지 않는다");

    await page.goto("/");
    await expect(page.getByRole("article").first()).toBeVisible();

    const visibleCards = await page.getByRole("article").evaluateAll((articles) => (
      articles.filter((article) => {
        const title = article.querySelector("h3, h4");
        return title !== null && title.getBoundingClientRect().bottom <= window.innerHeight;
      }).length
    ));
    expect(visibleCards).toBeGreaterThanOrEqual(2);
  });

  // .ai/DESIGN.md 원칙 1: 상세는 검색 유입의 실제 첫 화면이라 360×740 안에서 제목·날짜·장소·주요 버튼을 답해야 한다.
  test("상세 첫 화면에 제목, 날짜, 장소, 행사 안내 버튼이 보인다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "화면 폭을 직접 지정하므로 프로젝트마다 반복하지 않는다");

    await page.goto(SAMPLE_EVENT_PATH);
    const facts = page.getByRole("region", { name: "핵심 정보" });
    function factValue(label: string) {
      return facts.locator("dt", { hasText: label }).locator("xpath=following-sibling::dd[1]");
    }
    const firstScreen = [
      page.getByRole("heading", { level: 1 }),
      factValue("날짜"),
      factValue("장소"),
      page.getByRole("link", { name: /행사 안내/ }),
    ];

    for (const locator of firstScreen) {
      await expect(locator).toBeVisible();
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(740);
    }
  });

  // 모바일 상세는 행동 버튼이 화면 아래에 고정되어 있어, 페이지 끝까지 내려도 푸터 마지막 줄이 그 바에 가려지면 안 된다.
  test("상세를 끝까지 내리면 푸터 마지막 줄이 하단 행동 바에 가려지지 않는다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "화면 폭을 직접 지정하므로 프로젝트마다 반복하지 않는다");

    await page.goto(SAMPLE_EVENT_PATH);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));

    const lastFooterLine = page.getByRole("contentinfo").getByText(/All rights reserved/);
    await expect(lastFooterLine).toBeInViewport();
    const lineBox = await lastFooterLine.boundingBox();
    const barBox = await page.locator("[data-bottom-action-bar]").boundingBox();
    expect(lineBox).not.toBeNull();
    expect(barBox).not.toBeNull();
    expect(lineBox!.y + lineBox!.height).toBeLessThanOrEqual(barBox!.y);
  });
});
