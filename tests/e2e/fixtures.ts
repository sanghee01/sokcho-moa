import { expect, type Page } from "@playwright/test";

/** supabase/seed.sql에 있는 로컬 전용 관리자 계정. 로컬 Supabase에만 존재한다. */
export const LOCAL_ADMIN = {
  email: "admin@sokcho-moa.test",
  password: "local-admin-password",
};

/** supabase/seed.sql의 공개 샘플 행사. 상세 화면 E2E가 이 행사를 연다(seed를 바꾸면 여기 한 곳만 고친다). */
export const SAMPLE_EVENT_SLUG = "demo-sea-family-festival";
export const SAMPLE_EVENT_PATH = `/events/${SAMPLE_EVENT_SLUG}`;

/** supabase/seed.sql의 명소 하나. 명소 수정 화면(삭제 구역이 그려지는 화면) E2E가 연다. */
export const E2E_PLACE_ID = "20000000-0000-4000-8000-000000000073";

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
