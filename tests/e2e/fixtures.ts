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

export interface CapturedAnalyticsEvent {
  name: string;
  params: Record<string, string | number | boolean>;
}

/**
 * gtag가 dataLayer에 쌓은 GA 이벤트를 꺼낸다. E2E 서버는 운영 배포가 아니어서 GA 스크립트 없이 대기열만 채우므로,
 * 외부로 보내지 않고 보낼 내용을 확인할 수 있다. 공개 화면과 제보·의견 E2E가 함께 쓴다(2026-11-07).
 */
export async function capturedAnalyticsEvents(page: Page): Promise<CapturedAnalyticsEvent[]> {
  return page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: Array<ArrayLike<unknown>> }).dataLayer ?? [];
    return dataLayer.flatMap((entry) => {
      const values = Array.from(entry);
      if (values[0] !== "event" || typeof values[1] !== "string") return [];
      return [{
        name: values[1],
        params: values[2] && typeof values[2] === "object"
          ? values[2] as Record<string, string | number | boolean>
          : {},
      }];
    });
  });
}

/** 이름이 같은 GA 이벤트의 파라미터를 보낸 순서대로 돌려준다. 횟수와 값을 한 번에 확인할 때 쓴다. */
export async function analyticsEventParams(page: Page, name: string) {
  return (await capturedAnalyticsEvents(page))
    .filter((event) => event.name === name)
    .map((event) => event.params);
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("이메일").fill(LOCAL_ADMIN.email);
  await page.getByLabel("비밀번호").fill(LOCAL_ADMIN.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/admin(\?|$)/);
}
