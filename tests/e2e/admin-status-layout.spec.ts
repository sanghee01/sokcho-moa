import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN_EVENT, loginAsAdmin } from "./fixtures";

function eventRow(page: Page) {
  return page.getByRole("row").filter({ hasText: E2E_ADMIN_EVENT.title });
}

/** server action 요청(POST)을 늦추거나 실패시켜, 저장 중·실패 화면을 실제 관리자 화면에서 재현한다. */
async function interceptServerActions(page: Page, outcome: "delay" | "fail") {
  await page.route("**/admin**", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    if (outcome === "fail") return route.abort();
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    return route.continue();
  });
}

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test("관리자 상태 변경은 저장 중임을 알리고, 성공하면 반영하고, 실패하면 이전 상태로 되돌린다", async ({ page }, testInfo) => {
  // 같은 DB 행을 바꾸므로 한 브라우저 설정에서만 실행한다.
  test.skip(testInfo.project.name !== "desktop-chromium", "DB 상태를 바꾸는 test는 desktop에서만 실행");

  await page.goto("/admin?tab=events");
  const row = eventRow(page);
  const controls = row.getByLabel("공개 상태 변경");
  await expect(row).toContainText("검수 대기");

  await interceptServerActions(page, "delay");
  await row.getByRole("button", { name: "반려", exact: true }).click();
  await expect(controls).toHaveAttribute("aria-busy", "true");
  await expect(controls.getByRole("status")).toHaveText("변경 사항을 저장하고 있습니다.");
  await expect(controls).toHaveAttribute("aria-busy", "false");
  await expect(row).toContainText("반려");

  await page.unroute("**/admin**");
  await interceptServerActions(page, "fail");
  await row.getByRole("button", { name: "비공개", exact: true }).click();
  await expect(controls.getByRole("status")).toHaveText("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  await expect(controls).toHaveAttribute("aria-busy", "false");
  await expect(row).toContainText("반려");

  // 다음 실행을 위해 검수 대기로 되돌린다.
  await page.unroute("**/admin**");
  await row.getByRole("button", { name: "비공개", exact: true }).click();
  await expect(row).toContainText("검수 대기");
});

test("관리자 대시보드 목록에서 삭제 확인 창을 열고 취소할 수 있다", async ({ page }) => {
  await page.goto("/admin?tab=events");
  const row = eventRow(page);
  await row.getByRole("button", { name: "삭제", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: `${E2E_ADMIN_EVENT.title} 삭제` });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/복구할 수 없/)).toBeVisible();

  await dialog.getByRole("button", { name: "취소", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

test("로그아웃 상태에서는 관리자 화면 대신 로그인 화면으로 보낸다", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
