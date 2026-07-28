import { expect, test } from "@playwright/test";

test("일반 방문자 헤더는 대표 행사 주제를 주요 메뉴로 표시한다", async ({ page }) => {
  await page.goto("/e2e-test/header");

  const navigation = page.getByTestId("header-navigation-harness").getByRole("navigation", { name: "주요 메뉴" });
  await expect(navigation.getByRole("link", { name: "운영자", exact: true })).toHaveCount(0);
  await expect(navigation.getByRole("link")).toHaveText(["전체", "공연", "축제", "체험", "교육", "전시", "기타"]);
  await expect(navigation.getByRole("link", { name: "축제", exact: true })).toHaveAttribute("href", "/topics/festival");
});

test("운영자 헤더는 대표 행사 주제 다음에 대시보드 버튼을 표시한다", async ({ page }) => {
  await page.goto("/e2e-test/header?admin=1");

  const navigation = page.getByTestId("header-navigation-harness").getByRole("navigation", { name: "주요 메뉴" });
  const links = navigation.getByRole("link");
  await expect(links).toHaveText(["전체", "공연", "축제", "체험", "교육", "전시", "기타", "운영자"]);
  await expect(navigation.getByRole("link", { name: "운영자", exact: true })).toHaveAttribute("href", "/admin");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
