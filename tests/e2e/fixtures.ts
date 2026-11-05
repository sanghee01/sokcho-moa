import { expect, type Page } from "@playwright/test";

/** supabase/seed.sql에 있는 로컬 전용 관리자 계정. 로컬 Supabase에만 존재한다. */
export const LOCAL_ADMIN = {
  email: "admin@sokcho-moa.test",
  password: "local-admin-password",
};

/** supabase/seed.sql의 관리자 E2E 전용 행사(검수 대기). 공개 화면에는 보이지 않는다. */
export const E2E_ADMIN_EVENT = {
  id: "10000000-0000-4000-8000-000000000091",
  slug: "e2e-admin-pending",
  title: "[E2E] 관리자 검수 테스트 행사",
};

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("이메일").fill(LOCAL_ADMIN.email);
  await page.getByLabel("비밀번호").fill(LOCAL_ADMIN.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/admin(\?|$)/);
}
