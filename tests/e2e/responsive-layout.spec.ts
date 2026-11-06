import { devices, expect, test, type Page } from "@playwright/test";

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
const publicPages = ["/", "/topics/festival", "/events/demo-sea-family-festival", "/report", "/feedback"];

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
});
