import { expect, test } from "@playwright/test";
import { currentSeoulMonth } from "@/tests/e2e/fixtures";

// 월별 행사 페이지(/months/YYYY-MM): "11월 속초 행사" 같은 검색과 AI 개요가 인용할 글을 화면과 HTML에 함께 둔다(2026-11-15).
const currentMonth = currentSeoulMonth();

test("홈 목록 아래 월별 링크로 이번 달 행사 페이지에 가면 제목·요약·행사 카드가 보인다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "월별 행사" }).getByRole("link", { name: `${currentMonth.label} 행사 일정` }).click();

  await expect(page).toHaveURL(new RegExp(`${currentMonth.path}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(currentMonth.label);
  await expect(page.getByText(`${currentMonth.label} 속초에서 열리는 행사는 모두`)).toBeVisible();
  await expect(page.getByRole("region", { name: "진행 중·예정 행사" }).getByRole("link", { name: /바다빛 가족 문화축제/ })).toBeVisible();
});

test("월별 행사 HTML은 JS 없이도 제목·요약·행사 목록이 푸터보다 먼저 오고 행사 목록 구조화 데이터를 담는다", async ({ request }) => {
  const response = await request.get(currentMonth.path);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const footerIndex = html.indexOf("<footer");

  for (const marker of ["<h1", `${currentMonth.label} 속초에서 열리는 행사는 모두`, 'aria-labelledby="month-current-events"']) {
    const index = html.indexOf(marker);
    expect(index, marker).toBeGreaterThan(-1);
    expect(index, marker).toBeLessThan(footerIndex);
  }
  expect(html).toContain('"@type":"ItemList"');
  expect(html).toMatch(new RegExp(`<link rel="canonical" href="[^"]*${currentMonth.path}"`));
});

test("형식이 틀린 달과 열지 않는 먼 달은 404로 응답한다", async ({ request }) => {
  const year = Number(currentMonth.path.slice("/months/".length, "/months/".length + 4));
  for (const path of ["/months/2026-13", "/months/2026-1", `/months/${year + 2}-01`]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});
