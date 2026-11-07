import { expect, test } from "@playwright/test";
import { E2E_ADMIN_EVENT, E2E_PLACE_ID, loginAsAdmin } from "@/tests/e2e/fixtures";

// .ai/DESIGN.md "관리자": 데스크톱 기준으로 만들어도 되지만 768px에서 가로로 넘치지 않아야 한다(디자인 개편 6단계 완료 조건).
// 표처럼 넓은 내용은 자기 안에서만 가로로 밀리고, 페이지 전체는 넘치지 않는다.
const adminPages = [
  "/admin",
  "/admin?tab=exclusions",
  "/admin?tab=reports",
  "/admin?tab=feedback",
  "/admin?tab=places",
  "/admin/events/new",
  `/admin/events/${E2E_ADMIN_EVENT.id}`,
  "/admin/places/new",
  // 수정 화면은 작성 화면에 없는 삭제 구역을 그린다. 이 구역이 서버에서 client 전용 함수를 불러 화면이 열리지 않던 문제를 잡는다(2026-11-07).
  `/admin/places/${E2E_PLACE_ID}`,
  "/admin/import",
];

test.use({ viewport: { width: 768, height: 1024 } });

for (const path of adminPages) {
  test(`768px 관리자 ${path} 화면이 가로로 넘치지 않는다`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "화면 폭을 직접 지정하므로 프로젝트마다 반복하지 않는다");

    await loginAsAdmin(page);
    await page.goto(path);
    // 탭마다 제목 수준이 달라, 화면이 그려졌는지는 관리자 메뉴와 본문이 보이는지로 확인한다.
    await expect(page.getByRole("navigation", { name: "관리자 메뉴" })).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();

    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  });
}
