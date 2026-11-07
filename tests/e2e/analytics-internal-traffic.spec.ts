import { expect, test, type Page } from "@playwright/test";
import { analyticsEventParams, loginAsAdmin } from "@/tests/e2e/fixtures";

/** gtag('set', ...)으로 쌓인 값. 운영자 기기 표시(traffic_type)가 여기에 들어간다. */
async function analyticsSetCommands(page: Page) {
  return page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: Array<ArrayLike<unknown>> }).dataLayer ?? [];
    return dataLayer.flatMap((entry) => {
      const values = Array.from(entry);
      return values[0] === "set" ? [values[1]] : [];
    });
  });
}

test("일반 방문자의 GA 이벤트에는 내부 트래픽 표시가 없다", async ({ page }) => {
  await page.goto("/");
  await expect.poll(() => analyticsEventParams(page, "page_view")).toHaveLength(1);

  expect(await analyticsSetCommands(page)).toEqual([]);
});

test("관리자 화면에 들어간 기기는 그 뒤 공개 화면의 GA 이벤트도 내부 트래픽으로 표시한다", async ({ page }) => {
  await loginAsAdmin(page);
  await expect.poll(() => analyticsSetCommands(page)).toEqual([{ traffic_type: "internal" }]);

  // 새로 연 공개 화면에서도 page_view보다 먼저 표시가 붙는다.
  await page.goto("/");
  await expect.poll(() => analyticsEventParams(page, "page_view")).toHaveLength(1);
  expect(await analyticsSetCommands(page)).toEqual([{ traffic_type: "internal" }]);
});
