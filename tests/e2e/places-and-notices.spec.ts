import { expect, test } from "@playwright/test";
import { analyticsEventParams, loginAsAdmin, SAMPLE_NO_PHOTO_PLACE, SAMPLE_NOTICE, SAMPLE_PHOTO_PLACE, SAMPLE_PLACE, searchFromHeader } from "@/tests/e2e/fixtures";
import { routeFakeNaverMaps } from "@/tests/e2e/naver-maps-stub";

const NOTICE_PATH_PATTERN = /^\/notices\/[0-9a-f-]{36}$/;

// 즐길거리(상시 운영 장소) 목록·상세와 공지 기능(2026-11-21). 데이터는 supabase/seed.sql의 장소와 공지 샘플이다.

test.describe("가볼만한 곳", () => {
  test("목록에서 분류를 고르고 장소 상세로 간다", async ({ page }) => {
    await page.goto("/places");
    await expect(page.getByRole("heading", { level: 1, name: "속초 가볼만한 곳" })).toBeVisible();

    const categoryNav = page.getByRole("navigation", { name: "가볼만한 곳 분류" });
    await expect(categoryNav.getByRole("link", { name: "전체" })).toHaveAttribute("aria-current", "page");
    await categoryNav.getByRole("link", { name: SAMPLE_PLACE.categoryLabel }).click();
    await expect(page).toHaveURL(`/places/category/${SAMPLE_PLACE.category}`);
    await expect(page.getByRole("heading", { level: 1, name: `속초 ${SAMPLE_PLACE.categoryLabel}` })).toBeVisible();

    await page.getByRole("main").getByRole("link", { name: new RegExp(SAMPLE_PLACE.name) }).click();
    await expect(page).toHaveURL(SAMPLE_PLACE.path);
    await expect(page.getByRole("heading", { level: 1, name: SAMPLE_PLACE.name })).toBeVisible();
  });

  test("상세 첫 화면에 이름과 밖으로 나가는 버튼이 보이고, 확인일과 제보 링크가 있다", async ({ page }) => {
    await page.goto(SAMPLE_PLACE.path);
    const main = page.getByRole("main");

    await expect(main.getByRole("heading", { level: 1, name: SAMPLE_PLACE.name })).toBeInViewport();
    const official = main.getByRole("link", { name: /공식 홈페이지/ });
    await expect(official).toBeInViewport();
    // 여기서 사지 않고 공식 사이트로 보낸다: 새 창으로 열리는 외부 주소여야 한다.
    await expect(official).toHaveAttribute("target", "_blank");
    await expect(official).toHaveAttribute("href", /^https:\/\//);
    await expect(main.getByRole("link", { name: /길찾기/ })).toBeInViewport();

    await expect(main.getByText(/\d{4}년 \d{1,2}월 확인/)).toBeVisible();
    await expect(main.getByRole("link", { name: "정보가 다른가요? 알려 주세요" })).toHaveAttribute("href", "/feedback");
  });

  test("상세를 열고 공식 홈페이지를 누르면 GA 이벤트를 보낸다", async ({ page }) => {
    await page.goto(SAMPLE_PLACE.path);
    await expect.poll(() => analyticsEventParams(page, "place_detail_viewed")).toEqual([
      { place_slug: SAMPLE_PLACE.slug, place_category: SAMPLE_PLACE.category },
    ]);

    // 새 창이 열려도 원래 화면의 기록을 본다.
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("main").getByRole("link", { name: /공식 홈페이지/ }).click();
    await (await popupPromise).close();
    await expect.poll(() => analyticsEventParams(page, "place_link_clicked")).toEqual([
      { place_slug: SAMPLE_PLACE.slug, place_category: SAMPLE_PLACE.category, link_type: "official" },
    ]);
  });

  // 사진은 재게시 조건이 출처 표시인 것만 쓴다. 사진이 보이면 바로 아래에 출처가 원본 페이지 링크로 있어야 한다(2026-11-21).
  test("사진이 있는 장소는 상세에 사진과 출처 링크가 보이고, 사진이 실제로 불러와진다", async ({ page }) => {
    await page.goto(SAMPLE_PHOTO_PLACE.path);
    const main = page.getByRole("main");
    // 사진이 들어가도 제목과 밖으로 나가는 버튼은 첫 화면에 남는다.
    await expect(main.getByRole("heading", { level: 1, name: SAMPLE_PHOTO_PLACE.name })).toBeInViewport();
    await expect(main.getByRole("link", { name: /공식 홈페이지/ })).toBeInViewport();

    const photo = main.getByRole("img", { name: SAMPLE_PHOTO_PLACE.photoAlt });
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

    const credit = main.getByRole("figure").getByRole("link", { name: /사진: .+위키미디어 공용/ });
    await expect(credit).toHaveAttribute("href", SAMPLE_PHOTO_PLACE.sourceUrl);
  });

  test("사진이 없는 장소는 사진 자리를 비워 두지 않는다", async ({ page }) => {
    await page.goto(SAMPLE_NO_PHOTO_PLACE.path);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: SAMPLE_NO_PHOTO_PLACE.name })).toBeVisible();
    await expect(main.getByRole("figure")).toHaveCount(0);
  });

  test("목록에서 사진이 있는 장소의 썸네일이 실제로 불러와진다", async ({ page }) => {
    await page.goto(`/places/category/${SAMPLE_PHOTO_PLACE.category}`);
    const row = page.getByRole("main").getByRole("link", { name: new RegExp(SAMPLE_PHOTO_PLACE.name) });
    const thumbnail = row.locator("img");
    await thumbnail.scrollIntoViewIfNeeded();
    await expect.poll(() => thumbnail.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  });

  test("모르는 분류와 없는 장소는 열지 않는다", async ({ page }) => {
    expect((await page.goto("/places/category/cafe"))?.status()).toBe(404);
    expect((await page.goto("/places/no-such-place"))?.status()).toBe(404);
  });

  test("sitemap에 가볼만한 곳 목록과 장소 상세가 있다", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/places</loc>");
    expect(xml).toContain(`${SAMPLE_PLACE.path}</loc>`);
  });
});

// 헤더의 통합 검색은 행사와 가볼만한 곳을 함께 찾고, 범위 칩과 건수로 좁힌다(2026-11-21 사용자 결정).
test.describe("통합 검색", () => {
  test("행사와 가볼만한 곳을 함께 찾고, 범위를 좁히면 그 종류만 보인다", async ({ page }) => {
    await page.goto("/");
    await searchFromHeader(page, "워터");
    const scopes = page.getByRole("navigation", { name: "검색 범위" });
    await expect(scopes.locator('a[aria-current="page"]')).toContainText("전체");
    await expect(page.getByRole("region", { name: "가볼만한 곳" }).getByRole("link", { name: new RegExp(SAMPLE_PLACE.name) })).toBeVisible();

    await scopes.getByRole("link", { name: /^가볼만한 곳/ }).click();
    await expect(page).toHaveURL(/type=places/);
    await expect(page.getByRole("region", { name: "행사" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "가볼만한 곳" })).toBeVisible();
  });

  test("결과가 없으면 다시 찾을 방법을 알려 주고, 검색 화면에서는 하단 탭을 숨긴다", async ({ page }) => {
    await page.goto("/search?q=%EC%97%86%EB%8A%94%EC%9E%A5%EC%86%8C%EC%9D%B4%EB%A6%84");
    await expect(page.getByText("에 맞는 행사나 장소가 없어요.")).toBeVisible();
    await expect(page.locator("[data-bottom-nav]")).toBeHidden();
    await expect.poll(() => analyticsEventParams(page, "site_search_viewed")).toEqual([{ query_length: 6, event_count: 0, place_count: 0 }]);
  });

  test("검색 결과는 검색엔진에 올리지 않는다", async ({ request }) => {
    const html = await (await request.get("/search?q=%EB%B0%94%EB%8B%A4")).text();
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });
});

test.describe("지도의 가볼만한 곳", () => {
  test.beforeEach(async ({ page }) => {
    await routeFakeNaverMaps(page);
  });

  test("레이어를 가볼만한 곳으로 바꾸면 장소 핀이 보이고, 누르면 장소 카드에서 상세로 간다", async ({ page }) => {
    await page.goto("/map");
    await page.getByRole("group", { name: "지도 레이어" }).getByRole("button", { name: "가볼만한 곳" }).click();
    await expect(page).toHaveURL(/layer=places/);

    await page.getByRole("button", { name: `${SAMPLE_PHOTO_PLACE.name}, 가볼만한 곳` }).click();
    const panel = page.getByRole("region", { name: "가볼만한 곳" });
    await expect(panel.getByRole("heading", { name: SAMPLE_PHOTO_PLACE.name })).toBeVisible();
    await panel.getByRole("link", { name: "자세히 보기" }).click();
    await expect(page).toHaveURL(SAMPLE_PHOTO_PLACE.path);
  });
});

test.describe("공지", () => {
  test("공지 목록에는 공개한 글만 보이고, 누르면 글 페이지로 간다", async ({ page }) => {
    await page.goto("/notices");
    await expect(page.getByRole("heading", { level: 1, name: "공지사항" })).toBeVisible();
    await expect(page.getByText(SAMPLE_NOTICE.hiddenTitle)).toHaveCount(0);
    await page.getByRole("main").getByRole("link", { name: new RegExp(SAMPLE_NOTICE.title.replace(/[[\]]/g, "\\$&")) }).click();
    await expect(page).toHaveURL(new RegExp(`/notices/${SAMPLE_NOTICE.id}$`));
    await expect(page.getByRole("heading", { level: 1, name: SAMPLE_NOTICE.title })).toBeVisible();
  });

  test("공개하지 않은 공지와 형식이 틀린 주소는 열지 않는다", async ({ page }) => {
    expect((await page.goto("/notices/40000000-0000-4000-8000-000000000002"))?.status()).toBe(404);
    expect((await page.goto("/notices/not-a-uuid"))?.status()).toBe(404);
  });

  // 공지 띠는 그때 가장 최근 공지를 보인다. 관리자 E2E가 같은 시간에 새 공지를 공개할 수 있어 특정 글에 기대지 않는다.
  test("상단 공지 띠를 누르면 그 글로 가고, 닫은 글은 새로 열어도 다시 뜨지 않는다", async ({ page }) => {
    await page.goto("/report");
    const banner = page.getByRole("complementary", { name: "새 공지" });
    await expect(banner).toBeVisible();
    const link = banner.getByRole("link");
    const href = await link.getAttribute("href");
    expect(href).toMatch(NOTICE_PATH_PATTERN);
    const title = (await link.innerText()).split("\n").pop()?.trim() ?? "";

    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    await banner.getByRole("button", { name: "공지 닫기" }).click();
    await expect(banner).toHaveCount(0);

    await page.goto("/report");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(`[data-notice-banner]:visible a[href="${href}"]`)).toHaveCount(0);
  });

  // 홈에서도 다른 페이지처럼 헤더 아래 띠로 알린다(2026-11-21 사용자 결정).
  test("홈에서도 헤더 아래 공지 띠로 알린다", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("complementary", { name: "새 공지" });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("link")).toHaveAttribute("href", NOTICE_PATH_PATTERN);
  });

  test("지도 탭에서는 공지 띠를 숨긴다", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
    await expect(page.getByRole("complementary", { name: "새 공지" })).toBeHidden();
  });

  test("관리자가 공지를 쓰고 공개하면 목록에 보이고, 지우면 사라진다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "DB를 바꾸는 흐름은 한 프로젝트에서만 실행한다");
    const title = `E2E 공지 작성 확인 ${Date.now()}`;

    await loginAsAdmin(page);
    await page.goto("/admin?tab=notices");
    await expect(page.getByRole("link", { name: new RegExp(SAMPLE_NOTICE.hiddenTitle.replace(/[[\]]/g, "\\$&")) })).toBeVisible();

    await page.goto("/admin/notices/new");
    await page.getByLabel("종류").selectOption("notice");
    await page.getByLabel("제목").fill(title);
    await page.getByLabel("내용").fill("E2E가 쓴 공지 본문입니다.\n둘째 줄입니다.");
    await page.getByLabel("방문자에게 공개").check();
    await page.getByRole("button", { name: "공지 저장" }).click();
    await expect(page).toHaveURL(/\/admin\/notices\/[0-9a-f-]{36}\?result=notice-saved$/);
    await expect(page.getByText("공지를 저장했습니다.")).toBeVisible();

    await page.goto("/notices");
    await expect(page.getByRole("main").getByRole("link", { name: new RegExp(title) })).toBeVisible();

    await page.goBack();
    await page.getByRole("button", { name: "공지 삭제" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "공지 삭제" }).click();
    await expect(page).toHaveURL(/\/admin\?tab=notices&result=notice-deleted$/);

    await page.goto("/notices");
    await expect(page.getByRole("main").getByRole("link", { name: new RegExp(title) })).toHaveCount(0);
  });
});
