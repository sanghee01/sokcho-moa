import { expect, test } from "@playwright/test";
import { analyticsEventParams } from "@/tests/e2e/fixtures";

const KAKAOTALK_USER_AGENT = "Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36;KAKAOTALK 2410520";

test("utm 꼬리표로 들어오면 GA page_view에는 꼬리표를 담고, 주소창에서는 꼬리표만 지운다", async ({ page }) => {
  await page.goto("/?utm_source=share&utm_medium=social&sort=views");

  await expect.poll(() => analyticsEventParams(page, "page_view")).toHaveLength(1);
  const [pageView] = await analyticsEventParams(page, "page_view");
  expect(pageView.page_location).toContain("utm_source=share");

  await expect.poll(() => new URL(page.url()).search).toBe("?sort=views");
});

test.describe("카카오톡 앱 안 브라우저", () => {
  test.use({ userAgent: KAKAOTALK_USER_AGENT });

  test("앱 이름을 page_view보다 먼저 GA 공통 값으로 붙인다", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => analyticsEventParams(page, "page_view")).toHaveLength(1);

    const commands = await page.evaluate(() => {
      const dataLayer = (window as Window & { dataLayer?: Array<ArrayLike<unknown>> }).dataLayer ?? [];
      return dataLayer.map((entry) => Array.from(entry).slice(0, 2));
    });
    const setIndex = commands.findIndex(([command, value]) => (
      command === "set" && JSON.stringify(value) === JSON.stringify({ in_app_browser: "kakaotalk" })
    ));
    const pageViewIndex = commands.findIndex(([command, name]) => command === "event" && name === "page_view");
    expect(setIndex).toBeGreaterThanOrEqual(0);
    expect(setIndex).toBeLessThan(pageViewIndex);
  });
});
