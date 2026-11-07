import { expect, test } from "@playwright/test";
import { SAMPLE_EVENT_PATH } from "@/tests/e2e/fixtures";

test("일반 방문자 헤더는 대표 행사 주제를 주요 메뉴로 표시한다", async ({ page }) => {
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(navigation.getByRole("link", { name: "운영자", exact: true })).toHaveCount(0);
  await expect(navigation.getByRole("link")).toHaveText(["전체", "공연", "축제", "체험", "교육", "전시", "기타"]);
  await expect(navigation.getByRole("link", { name: "축제", exact: true })).toHaveAttribute("href", "/topics/festival");
});

test("현재 주제만 주요 메뉴의 활성 링크로 표시한다", async ({ page }) => {
  await page.goto("/topics/festival");

  const navigation = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(navigation.locator('a[aria-current="page"]')).toHaveText("축제");
  await expect(navigation.getByRole("link", { name: "운영자", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

// 2026-11-07 사용자 결정: 목록(홈·분야)에서는 분야 탭이 헤더와 함께 화면 위에 고정된다.
// PC는 로고 옆 한 줄, 모바일은 로고 아래 줄이다. 상세처럼 목록이 아닌 페이지에는 탭을 두지 않는다.
test("목록에서 아래로 내려도 분야 탭이 화면 위에 남는다", async ({ page }) => {
  await page.goto("/topics/festival");
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));

  const navigation = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(navigation.getByRole("link", { name: "전체", exact: true })).toBeInViewport();
  await expect(navigation.getByRole("link", { name: "기타", exact: true })).toBeInViewport();
});

test("행사 상세에는 분야 탭을 두지 않는다", async ({ page }) => {
  await page.goto(SAMPLE_EVENT_PATH);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "주요 메뉴" })).toHaveCount(0);
});

test("검색 로봇은 관리자·API 경로를 수집하지 않는다", async ({ request }) => {
  const response = await request.get("/robots.txt");

  expect(response.ok()).toBe(true);
  const robots = await response.text();
  expect(robots).toContain("Disallow: /admin/");
  expect(robots).toContain("Disallow: /api/");
});
