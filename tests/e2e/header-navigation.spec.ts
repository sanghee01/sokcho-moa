import { expect, test } from "@playwright/test";

test("일반 방문자 헤더에는 운영자 버튼을 표시하지 않는다", async ({ page }) => {
  await page.goto("/e2e-test/header");

  const navigation = page.getByTestId("header-navigation-harness").getByRole("navigation", { name: "주요 메뉴" });
  await expect(navigation.getByRole("link", { name: "운영자", exact: true })).toHaveCount(0);
  await expect(navigation.getByRole("link", { name: "의견 보내기", exact: true })).toBeVisible();
});

test("운영자 헤더는 의견 보내기 다음에 대시보드 버튼을 표시한다", async ({ page }) => {
  await page.goto("/e2e-test/header?admin=1");

  const navigation = page.getByTestId("header-navigation-harness").getByRole("navigation", { name: "주요 메뉴" });
  const links = navigation.getByRole("link");
  await expect(links).toHaveText(["행사 제보하기", "의견 보내기", "운영자"]);
  await expect(navigation.getByRole("link", { name: "운영자", exact: true })).toHaveAttribute("href", "/admin");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
