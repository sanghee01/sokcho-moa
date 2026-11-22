import { expect, test, type Page } from "@playwright/test";
import { routeFakeNaverMaps } from "@/tests/e2e/naver-maps-stub";

// 상세의 "목록으로 돌아가기"는 목록에서 들어왔으면 들어오기 전 화면(같은 분류·탭, 같은 스크롤 위치, 같은 지도)으로 돌아간다.
// 검색 등으로 상세에 바로 들어왔으면 정해 둔 목록으로 간다(header-navigation.spec.ts). 2026-11-22 사용자 결정.

async function getScrollY(page: Page) {
  return page.evaluate(() => window.scrollY);
}

test("가볼만한 곳 분류 목록에서 상세에 갔다가 돌아가면 같은 분류의 같은 위치로 돌아간다", async ({ page }) => {
  await page.goto("/places/category/nature");
  const rows = page.getByRole("main").getByRole("listitem");
  const target = rows.nth((await rows.count()) - 3);
  await target.scrollIntoViewIfNeeded();
  const scrollBefore = await getScrollY(page);
  expect(scrollBefore).toBeGreaterThan(200);

  await target.getByRole("link").click();
  await expect(page).toHaveURL(/\/places\/(?!category)[^/]+$/);
  await page.getByRole("main").getByRole("link", { name: "목록으로 돌아가기" }).first().click();

  await expect(page).toHaveURL(/\/places\/category\/nature$/);
  await expect.poll(() => getScrollY(page)).toBeGreaterThan(scrollBefore - 50);
});

// 돌아올 때 스크롤이 맨 위에서 그 위치까지 미끄러져 내려가면 정신없다(2026-11-22 사용자 피드백). 바로 그 위치에 있어야 한다.
test("목록으로 돌아올 때 스크롤이 미끄러지지 않고 바로 그 위치에 있다", async ({ page }) => {
  await page.goto("/places");
  const rows = page.getByRole("main").getByRole("listitem");
  const target = rows.nth((await rows.count()) - 3);
  await target.scrollIntoViewIfNeeded();
  const scrollBefore = await getScrollY(page);
  expect(scrollBefore).toBeGreaterThan(1000);

  await target.getByRole("link").click();
  await expect(page).toHaveURL(/\/places\/(?!category)[^/]+$/);
  // 돌아가는 동안의 스크롤 위치를 짧은 간격으로 모은다. 미끄러지면 0과 목표 사이 값이 여러 번 찍힌다.
  await page.evaluate(() => {
    const samples: number[] = [];
    (window as unknown as { __scrollSamples: number[] }).__scrollSamples = samples;
    const timer = window.setInterval(() => samples.push(window.scrollY), 16);
    window.setTimeout(() => window.clearInterval(timer), 1500);
  });
  await page.getByRole("main").getByRole("link", { name: "목록으로 돌아가기" }).first().click();
  await expect(page).toHaveURL(/\/places$/);
  await page.waitForTimeout(1600);
  const samples = await page.evaluate(() => (window as unknown as { __scrollSamples: number[] }).__scrollSamples);
  const inBetween = samples.filter((y) => y > 50 && y < scrollBefore - 50);
  expect(inBetween).toEqual([]);
  expect(samples.at(-1)).toBeGreaterThan(scrollBefore - 50);
});

test("행사 목록에서 상세에 갔다가 맨 아래 버튼으로 돌아가면 같은 위치로 돌아간다", async ({ page }) => {
  await page.goto("/");
  const cards = page.getByRole("region", { name: "행사 목록" }).getByRole("article");
  const target = cards.last();
  await target.scrollIntoViewIfNeeded();
  const scrollBefore = await getScrollY(page);
  expect(scrollBefore).toBeGreaterThan(200);

  await target.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/events\//);
  await page.getByRole("link", { name: "목록으로 돌아가기" }).last().click();

  await expect(page).toHaveURL(/:\d+\/$/);
  await expect.poll(() => getScrollY(page)).toBeGreaterThan(scrollBefore - 50);
});

test("지도에서 상세에 갔다가 돌아가면 같은 카드와 확대 수준으로 돌아간다", async ({ page }) => {
  await routeFakeNaverMaps(page);
  await page.goto("/map");
  const pin = page.getByRole("button", { name: /^국립산악박물관, 행사 \d+개$/ });
  await expect(pin).toBeVisible();
  // 방문자가 지도를 확대해 둔 상태를 만든다(가짜 SDK의 지도, naver-maps-stub.ts).
  await page.evaluate(() => {
    const maps = (window as unknown as { __fakeNaverMaps: { setZoom: (zoom: number) => void }[] }).__fakeNaverMaps;
    maps[maps.length - 1].setZoom(16);
  });
  await pin.click();
  const panel = page.getByRole("region", { name: "국립산악박물관" });
  await panel.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/events\//);

  await page.getByRole("link", { name: "목록으로 돌아가기" }).first().click();

  await expect(page).toHaveURL(/\/map\?place=/);
  await expect(panel).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const maps = (window as unknown as { __fakeNaverMaps: { getZoom: () => number }[] }).__fakeNaverMaps;
    return maps[maps.length - 1].getZoom();
  })).toBe(16);
});
