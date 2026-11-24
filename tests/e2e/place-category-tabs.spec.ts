import { expect, test, type Locator, type Page } from "@playwright/test";

// 가볼만한 곳 분류 칩 줄은 모바일에서 가로로 밀어 본다. 뒤쪽 분류를 누르거나 상세에서 돌아와도
// 줄이 "전체" 쪽으로 되돌아가지 않고 고른 칩이 보여야 한다(2026-11-24 사용자 요청).

const MOBILE_VIEWPORT = { width: 360, height: 740 };

function getCategoryNav(page: Page) {
  return page.getByRole("navigation", { name: "가볼만한 곳 분류" });
}

/** 칩 줄을 가로로 미는 칸. 분류 칩 nav를 감싼 칸이다. */
function getChipScroller(page: Page) {
  return getCategoryNav(page).locator("xpath=..");
}

async function getScrollLeft(scroller: Locator) {
  return scroller.evaluate((element) => element.scrollLeft);
}

/** 칩이 가로로 미는 칸 안에 잘리지 않고 다 보이는지. */
async function isFullyVisibleInRow(chip: Locator) {
  return chip.evaluate((element) => {
    const scroller = element.closest("nav")?.parentElement;
    if (!scroller) return false;
    const row = scroller.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return rect.left >= row.left - 1 && rect.right <= row.right + 1;
  });
}

/** 페이지를 열고 스크립트가 붙을 때까지 기다린다. 붙기 전에는 칩이 첫 HTML의 칩에서 바뀌고, 누르면 문서를 새로 불러온다. */
async function openList(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "화면 폭을 직접 지정하므로 프로젝트마다 반복하지 않는다");
  await page.setViewportSize(MOBILE_VIEWPORT);
});

test("모바일에서 뒤쪽 분류를 누르면 분류 줄이 처음으로 돌아가지 않는다", async ({ page }) => {
  await openList(page, "/places");
  const scroller = getChipScroller(page);
  const lastChip = getCategoryNav(page).getByRole("link").last();
  await lastChip.scrollIntoViewIfNeeded();
  const scrollBefore = await getScrollLeft(scroller);
  expect(scrollBefore).toBeGreaterThan(0);

  await lastChip.click();

  await expect(page).toHaveURL(/\/places\/category\/[^/]+$/);
  await expect(lastChip).toHaveAttribute("aria-current", "page");
  expect(Math.abs((await getScrollLeft(scroller)) - scrollBefore)).toBeLessThanOrEqual(1);
  expect(await isFullyVisibleInRow(lastChip)).toBe(true);
});

test("뒤쪽 분류 페이지에 바로 들어오면 고른 분류 칩이 보인다", async ({ page }) => {
  await openList(page, "/places");
  const lastHref = await getCategoryNav(page).getByRole("link").last().getAttribute("href");
  expect(lastHref).toMatch(/^\/places\/category\/[^/?]+$/);

  await openList(page, lastHref ?? "/places");

  const selectedChip = getCategoryNav(page).locator('[aria-current="page"]');
  await expect(selectedChip).toHaveAttribute("href", lastHref ?? "");
  await expect.poll(() => isFullyVisibleInRow(selectedChip)).toBe(true);
});

// 칩 줄 뒤의 inline script가 첫 그리기 전에 민다. React가 붙기 전 상태를 보려고 Next.js 스크립트를 막는다(inline script는 HTML 안에 있어 그대로 돈다).
test("앱 스크립트를 불러오기 전에도 뒤쪽 분류 칩이 보인다", async ({ page }) => {
  await openList(page, "/places");
  const lastHref = await getCategoryNav(page).getByRole("link").last().getAttribute("href");
  expect(lastHref).toMatch(/^\/places\/category\/[^/?]+$/);

  await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
  await page.goto(lastHref ?? "/places");

  const selectedChip = getCategoryNav(page).locator('[aria-current="page"]');
  await expect(selectedChip).toHaveAttribute("href", lastHref ?? "");
  expect(await isFullyVisibleInRow(selectedChip)).toBe(true);
});

// 칩 줄은 분류를 바꿔도 남아 가로 위치가 그대로다. 누르지 않고 고른 분류가 바뀌면(뒤로 가기, 하단 탭) 고른 칩이 화면 밖에 남으면 안 된다(2026-11-24 리뷰).
test("뒤쪽 분류를 누른 뒤 뒤로 가면 전체 칩이 보인다", async ({ page }) => {
  await openList(page, "/places");
  const lastChip = getCategoryNav(page).getByRole("link").last();
  await lastChip.scrollIntoViewIfNeeded();
  await lastChip.click();
  await expect(page).toHaveURL(/\/places\/category\/[^/]+$/);

  await page.goBack();

  await expect(page).toHaveURL(/\/places$/);
  const allChip = getCategoryNav(page).getByRole("link", { name: "전체" });
  await expect(allChip).toHaveAttribute("aria-current", "page");
  await expect.poll(() => isFullyVisibleInRow(allChip)).toBe(true);
});

test("뒤쪽 분류에서 상세에 갔다가 돌아오면 고른 분류 칩이 보인다", async ({ page }) => {
  await openList(page, "/places");
  const lastChip = getCategoryNav(page).getByRole("link").last();
  await lastChip.scrollIntoViewIfNeeded();
  await lastChip.click();
  await expect(page).toHaveURL(/\/places\/category\/[^/]+$/);
  const categoryUrl = page.url();

  await page.getByRole("main").getByRole("listitem").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/places\/(?!category)[^/]+$/);
  await page.getByRole("main").getByRole("link", { name: "목록으로 돌아가기" }).first().click();

  await expect(page).toHaveURL(categoryUrl);
  const selectedChip = getCategoryNav(page).locator('[aria-current="page"]');
  await expect(selectedChip).toBeVisible();
  await expect.poll(() => isFullyVisibleInRow(selectedChip)).toBe(true);
});
