import { expect, test } from "@playwright/test";
import { currentSeoulMonth } from "@/tests/e2e/fixtures";

// 월별 행사 페이지(/months/YYYY-MM): "11월 속초 행사" 같은 기간 검색에 답하는 페이지다. 화면에는 제목과 카드만 둔다(2026-11-15).
// 입구는 행사 목록의 "진행중 · 마감 · 월별" 탭이고(2026-11-21 시안 A, 그 전에는 "목록 | 월별 일정" 전환·헤더 버튼), 달은 페이지 위쪽 화살표로 넘긴다(2026-11-15 사용자 결정).
const currentMonth = currentSeoulMonth();
const nextMonth = currentSeoulMonth(new Date(), 1);

test("행사 목록의 월별 탭으로 이번 달 행사 페이지에 가면 제목과 행사 카드만 보이고 요약 문장은 화면에 없다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "행사 상태" }).getByRole("link", { name: "월별" }).click();

  await expect(page).toHaveURL(new RegExp(`${currentMonth.path}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(currentMonth.label);
  // 행사 수 문장은 검색 설명에만 쓰고 화면에는 두지 않는다(2026-11-15 사용자 결정).
  await expect(page.getByText("속초에서 열리는 행사는 모두")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "진행 중·예정 행사" }).getByRole("link", { name: /바다빛 가족 문화축제/ })).toBeVisible();
});

test("월별 페이지에서는 상태 탭의 월별이 선택되고, 진행중 목록으로 돌아갈 수 있다", async ({ page }) => {
  await page.goto(currentMonth.path);
  const views = page.getByRole("navigation", { name: "행사 상태" });
  await expect(views.locator('a[aria-current="page"]')).toHaveText("월별");
  await views.getByRole("link", { name: "진행중" }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
});

test("월별 페이지 위쪽 화살표로 다음 달과 이전 달을 오간다", async ({ page }) => {
  await page.goto(currentMonth.path);
  await page.getByRole("navigation", { name: "다른 달" }).getByRole("link", { name: `${nextMonth.label} 행사 보기` }).click();

  await expect(page).toHaveURL(new RegExp(`${nextMonth.path}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(nextMonth.label);
  // 다다음 달은 열지 않으므로 다음 달 화살표가 없다.
  await expect(page.getByRole("navigation", { name: "다른 달" }).getByRole("link")).toHaveCount(1);

  await page.getByRole("navigation", { name: "다른 달" }).getByRole("link", { name: `${currentMonth.label} 행사 보기` }).click();
  await expect(page).toHaveURL(new RegExp(`${currentMonth.path}$`));
});

// 월별 페이지에서 분야 탭은 다른 페이지로 가지 않고 그 달 안에서 거른다(2026-11-15 사용자 결정).
test("월별 페이지에서 분야 탭을 누르면 그 달의 그 분야만 보이고, 달을 넘겨도 분야가 유지된다", async ({ page }) => {
  await page.goto(currentMonth.path);
  const tabs = page.getByRole("navigation", { name: "행사 분야" });
  await tabs.getByRole("link", { name: "교육", exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`${currentMonth.path}/education$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("속초 교육 일정");
  await expect(tabs.getByRole("link", { name: "교육", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: /바다빛 가족 문화축제/ })).toHaveCount(0);

  await page.getByRole("navigation", { name: "다른 달" }).getByRole("link", { name: `${nextMonth.label} 행사 보기` }).click();
  await expect(page).toHaveURL(new RegExp(`${nextMonth.path}/education$`));

  await tabs.getByRole("link", { name: "전체", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${nextMonth.path}$`));
});

test("/months는 요청한 때의 이번 달 페이지로 보낸다", async ({ request }) => {
  const response = await request.get("/months", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(currentMonth.path);
});

test("월별 행사 HTML은 JS 없이도 제목·행사 목록이 푸터보다 먼저 오고 행사 수 설명과 행사 목록 구조화 데이터를 담는다", async ({ request }) => {
  const response = await request.get(currentMonth.path);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const footerIndex = html.indexOf("<footer");

  for (const marker of ["<h1", 'aria-labelledby="month-current-events"']) {
    const index = html.indexOf(marker);
    expect(index, marker).toBeGreaterThan(-1);
    expect(index, marker).toBeLessThan(footerIndex);
  }
  expect(html).toContain('"@type":"ItemList"');
  expect(html).toMatch(new RegExp(`<meta name="description" content="${currentMonth.label} 속초에서 열리는 행사는 모두`));
  expect(html).toMatch(new RegExp(`<link rel="canonical" href="[^"]*${currentMonth.path}"`));
});

test("형식이 틀린 달과 열지 않는 먼 달은 404로 응답한다", async ({ request }) => {
  const year = Number(currentMonth.path.slice("/months/".length, "/months/".length + 4));
  for (const path of ["/months/2026-13", "/months/2026-1", `/months/${year + 2}-01`]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});
