import { expect, test } from "@playwright/test";

test("일반 방문자 헤더는 대표 행사 주제를 주요 메뉴로 표시한다", async ({ page }) => {
  await page.goto("/e2e-test/header");

  const navigation = page.getByTestId("header-navigation-harness").getByRole("navigation", { name: "주요 메뉴" });
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

test("검색 로봇은 내부 E2E 화면을 수집하지 않는다", async ({ request }) => {
  const response = await request.get("/robots.txt");

  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain("Disallow: /e2e-test/");
});
