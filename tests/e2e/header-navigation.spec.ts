import { expect, test } from "@playwright/test";
import { SAMPLE_EVENT_PATH } from "@/tests/e2e/fixtures";

// 2026-11-21 사용자 결정: 주요 메뉴는 행사 · 가볼만한 곳 · 지도 세 곳이다. 모바일은 하단 탭, md 이상은 헤더 가로 메뉴다.
// 행사 분야 탭은 헤더에서 행사 목록 안으로 옮겼다("행사 분야").
test("주요 메뉴는 행사·가볼만한 곳·지도이고, 행사 목록에는 분야 탭이 있다", async ({ page }) => {
  await page.goto("/");

  const mainNavigation = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(mainNavigation.getByRole("link")).toHaveText(["행사", "가볼만한 곳", "지도"]);
  await expect(mainNavigation.locator('a[aria-current="page"]')).toHaveText("행사");

  const categories = page.getByRole("navigation", { name: "행사 분야" });
  await expect(categories.getByRole("link")).toHaveText(["전체", "공연", "축제", "체험", "교육", "전시", "기타"]);
  await expect(categories.getByRole("link", { name: "축제", exact: true })).toHaveAttribute("href", "/topics/festival");
});

test("현재 주제만 분야 탭의 활성 링크로 표시한다", async ({ page }) => {
  await page.goto("/topics/festival");

  const navigation = page.getByRole("navigation", { name: "행사 분야" });
  await expect(navigation.locator('a[aria-current="page"]')).toHaveText("축제");
  await expect(page.getByRole("navigation", { name: "주요 메뉴" }).locator('a[aria-current="page"]')).toHaveText("행사");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

// 목록에는 로딩 화면이 없어서 분야 탭을 누르면 응답이 올 때까지 이전 목록이 남는다(2026-11-15).
// 그 사이에도 누른 탭이 바로 선택되고 불러오는 중임을 알려, 느린 망에서 눌렸는지 모르는 일이 없게 한다.
test("분야 탭은 응답이 늦어도 누른 탭을 바로 선택하고 이전 목록을 남긴다", async ({ page }) => {
  let releaseRequest: () => void = () => {};
  const delayedResponse = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await page.route("**/topics/performance**", async (route) => {
    if (route.request().headers().rsc) await delayedResponse;
    await route.continue();
  });

  await page.goto("/topics/festival");
  const navigation = page.getByRole("navigation", { name: "행사 분야" });
  // 불러오는 동안에는 링크 이름에 "불러오는 중"이 붙어서 주소로 찾는다.
  const performanceTab = navigation.locator('a[href="/topics/performance"]');
  const festivalEvent = page.getByRole("region", { name: "행사 목록" }).getByRole("link", { name: /바다빛 가족 문화축제/ });
  await expect(festivalEvent).toBeVisible();

  await performanceTab.click();

  await expect(performanceTab).toHaveAttribute("aria-current", "page");
  await expect(performanceTab).toHaveAttribute("aria-busy", "true");
  await expect(navigation.locator('a[aria-current="page"]')).toHaveCount(1);
  await expect(festivalEvent).toBeVisible();

  releaseRequest();
  await expect(page).toHaveURL(/\/topics\/performance$/);
  await expect(performanceTab).toHaveAttribute("aria-busy", "false");
  await expect(festivalEvent).toHaveCount(0);
});

// 홈·분야 목록은 요청마다 그리는 동적 페이지라, loading.tsx가 없으면 Next.js가 미리 받아 두지 않는다(2026-11-15).
// 검색으로 상세에 바로 들어온 방문자가 목록으로 돌아갈 때 응답이 늦어도 눌렸음을 알린다.
test("상세의 목록으로 돌아가기는 응답이 늦어도 불러오는 중임을 알린다", async ({ page }) => {
  let releaseRequest: () => void = () => {};
  const delayedResponse = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await page.route((url) => url.pathname === "/", async (route) => {
    if (route.request().headers().rsc) await delayedResponse;
    await route.continue();
  });

  await page.goto(SAMPLE_EVENT_PATH);
  // 불러오는 동안에는 링크 이름 뒤에 "불러오는 중"이 붙어서 앞부분으로 찾는다.
  const backToList = page.getByRole("link", { name: /^목록으로 돌아가기/ });

  await backToList.click();

  await expect(backToList).toHaveAttribute("aria-busy", "true");
  expect(new URL(page.url()).pathname).toBe(SAMPLE_EVENT_PATH);

  releaseRequest();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  await expect(page.getByRole("region", { name: "행사 목록" })).toBeVisible();
});

test("정렬을 바꾸면 응답이 늦어도 누른 정렬이 불러오는 중임을 알린다", async ({ page }) => {
  let releaseRequest: () => void = () => {};
  const delayedResponse = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await page.route((url) => url.pathname === "/" && url.searchParams.get("sort") === "views", async (route) => {
    if (route.request().headers().rsc) await delayedResponse;
    await route.continue();
  });

  await page.goto("/");
  const viewsSort = page.getByRole("navigation", { name: "행사 정렬" }).locator('a[href*="sort=views"]');

  await viewsSort.click();

  await expect(viewsSort).toHaveAttribute("aria-busy", "true");

  releaseRequest();
  await expect(page).toHaveURL(/sort=views/);
  await expect(viewsSort).toHaveAttribute("aria-current", "page");
});

// 하단 탭은 스크롤해도 숨기지 않는다(Apple HIG Tab bars). 하단 행동 바가 있는 행사 상세에서는 탭 대신 바가 보인다(2026-11-21).
test("모바일 하단 탭은 내려도 화면에 남고, 상세에서는 행동 바가 대신 보인다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "하단 탭은 md 미만에서만 보인다");
  await page.goto("/topics/festival");
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  const bottomNavigation = page.locator("[data-bottom-nav]");
  await expect(bottomNavigation.getByRole("link", { name: "가볼만한 곳" })).toBeInViewport();

  await page.goto(SAMPLE_EVENT_PATH);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(bottomNavigation).toBeHidden();
  await expect(page.locator("[data-bottom-action-bar]").getByRole("link", { name: /행사 안내/ })).toBeInViewport();
});

test("행사 상세에는 분야 탭을 두지 않는다", async ({ page }) => {
  await page.goto(SAMPLE_EVENT_PATH);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "행사 분야" })).toHaveCount(0);
});

test("푸터에서 개인정보 처리방침을 열면 GA 사용을 안내한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "개인정보 처리방침" }).click();

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1, name: "개인정보 처리방침" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Google Analytics");
});

test("검색 로봇은 관리자·API 경로를 수집하지 않는다", async ({ request }) => {
  const response = await request.get("/robots.txt");

  expect(response.ok()).toBe(true);
  const robots = await response.text();
  expect(robots).toContain("Disallow: /admin/");
  expect(robots).toContain("Disallow: /api/");
});
