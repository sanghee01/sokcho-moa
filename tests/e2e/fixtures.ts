import { expect, type Page } from "@playwright/test";

/** supabase/seed.sql에 있는 로컬 전용 관리자 계정. 로컬 Supabase에만 존재한다. */
export const LOCAL_ADMIN = {
  email: "admin@sokcho-moa.test",
  password: "local-admin-password",
};

/** supabase/seed.sql의 공개 샘플 행사. 상세 화면 E2E가 이 행사를 연다(seed를 바꾸면 여기 한 곳만 고친다). */
export const SAMPLE_EVENT_SLUG = "demo-sea-family-festival";
export const SAMPLE_EVENT_PATH = `/events/${SAMPLE_EVENT_SLUG}`;

/**
 * 서울 기준 이번 달 월별 행사 페이지의 주소와 링크 이름. seed 행사는 now() 기준이라 이번 달 페이지에 늘 보인다.
 * 링크 이름은 features/events/components/month/event-month-links.tsx와 같다.
 */
export function currentSeoulMonth(now = new Date(), offset = 0) {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  const index = year * 12 + (month - 1) + offset;
  const shiftedYear = Math.floor(index / 12);
  const shiftedMonth = (index % 12) + 1;
  return {
    path: `/months/${shiftedYear}-${String(shiftedMonth).padStart(2, "0")}`,
    label: `${shiftedYear}년 ${shiftedMonth}월`,
  };
}

/** supabase/seed.sql의 명소 하나. 명소 수정 화면(삭제 구역이 그려지는 화면) E2E가 연다. */
export const E2E_PLACE_ID = "20000000-0000-4000-8000-000000000073";

/** supabase/seed.sql의 즐길거리 장소 하나(원본은 data/activity-places.json). 즐길거리 목록·상세 E2E가 연다. */
export const SAMPLE_PLACE = {
  slug: "seorak-waterpia",
  path: "/places/seorak-waterpia",
  name: "설악워터피아",
  category: "water",
  categoryLabel: "물놀이·온천",
};

/** supabase/seed.sql의 즐길거리 가운데 사진이 있는 장소(원본은 data/activity-places.json). 사진·출처 표기 E2E가 연다. */
export const SAMPLE_PHOTO_PLACE = {
  path: "/places/seorak-cable-car",
  name: "설악케이블카",
  category: "view",
  photoAlt: "설악산 숲 위를 지나는 설악케이블카",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Seoraksan_Cable_Car_04.jpg",
};

/** supabase/seed.sql의 즐길거리 가운데 사진이 없는 장소. 사진 자리를 비워 두지 않는지 확인한다. */
// 사진을 찾지 못한 장소. 스포츠 넥스트레벨은 2026-11-21 공식 누리집 사진이 생겨 바꿨다(레이저어택은 쓸 수 있는 사진이 없어 비워 둠).
export const SAMPLE_NO_PHOTO_PLACE = { path: "/places/laser-attack-sokcho", name: "레이저어택 속초점" };

/** supabase/seed.sql의 공지 샘플. 공개 글은 상단 공지 띠에 보이고, 비공개 글은 관리자 화면에만 보인다. */
export const SAMPLE_NOTICE = {
  id: "40000000-0000-4000-8000-000000000001",
  title: "[샘플] 속초 가볼만한 곳 메뉴가 생겼어요",
  hiddenTitle: "[샘플] 아직 공개하지 않은 공지",
};

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

/**
 * 헤더에서 통합 검색을 한다(2026-11-21). md 이상은 헤더의 열린 검색창, 모바일은 헤더 "검색" 아이콘으로 검색 화면에 가서 입력한다.
 * 어느 쪽이든 /search?q=로 간다.
 */
export async function searchFromHeader(page: Page, text: string) {
  const headerSearch = page.getByRole("banner").getByRole("search", { name: "사이트 검색" });
  if (await headerSearch.isVisible()) {
    await headerSearch.getByRole("searchbox").fill(text);
    await headerSearch.getByRole("searchbox").press("Enter");
  } else {
    await page.getByRole("banner").getByRole("link", { name: "검색", exact: true }).click();
    const field = page.getByRole("main").getByRole("search", { name: "사이트 검색" }).getByRole("textbox");
    await expect(field).toBeFocused();
    await field.fill(text);
    await field.press("Enter");
  }
  await expect(page).toHaveURL(/\/search\?q=/);
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("이메일").fill(LOCAL_ADMIN.email);
  await page.getByLabel("비밀번호").fill(LOCAL_ADMIN.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/admin(\?|$)/);
}
