import { expect, test } from "@playwright/test";
import { analyticsEventParams, loginAsAdmin, SAMPLE_NO_PHOTO_PLACE, SAMPLE_NOTICE, SAMPLE_PHOTO_PLACE, SAMPLE_PLACE, SAMPLE_REGION_PLACES, searchFromHeader } from "@/tests/e2e/fixtures";
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
    // 어느 목록에서 장소를 골랐는지 GA로 센다(2026-11-21).
    await expect.poll(() => analyticsEventParams(page, "select_content")).toContainEqual(
      expect.objectContaining({ content_type: "place", content_source: "place_list", place_category: SAMPLE_PLACE.category }),
    );

    // 상세 맨 위 "‹ 목록으로 돌아가기"와 맨 아래 버튼이 있다(2026-11-21 사용자 결정). 링크 주소는 가볼만한 곳 목록이지만,
    // 분류 목록에서 들어왔으므로 누르면 그 분류 목록으로 돌아간다(2026-11-22 사용자 결정, list-return.spec.ts).
    const backToListLinks = page.getByRole("main").getByRole("link", { name: "목록으로 돌아가기" });
    await expect(backToListLinks).toHaveCount(2);
    for (const link of await backToListLinks.all()) await expect(link).toHaveAttribute("href", "/places");
    await expect(backToListLinks.first()).toBeInViewport();
    await backToListLinks.first().click();
    await expect(page).toHaveURL(`/places/category/${SAMPLE_PLACE.category}`);
  });

  // 고성·양양 명소를 함께 싣고 지역 select로 거른다. 처음에는 속초가 골라져 있다(2026-11-22 사용자 결정). 지역은 주소에 남고 분류를 바꿔도 이어진다.
  // 목록은 정적 페이지라 다른 지역 줄은 HTML에 있고 화면에서만 숨는다(globals.css의 data-region-scope).
  test("처음에는 속초 장소만 보이고, 지역 select로 고성을 고르면 분류를 바꿔도 지역이 남고, 상세에서 돌아오면 그 지역 목록이다", async ({ page }) => {
    await page.goto("/places");
    const main = page.getByRole("main");
    const regionSelect = main.getByRole("combobox", { name: "지역" });
    await expect(regionSelect).toHaveValue("sokcho");
    // 속초 장소에도 지역 이름을 붙인다(2026-11-22 사용자 요청).
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_PLACE.name) })).toContainText("속초");
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_REGION_PLACES.yangyang.name) })).toBeHidden();

    await regionSelect.selectOption("goseong");
    await expect(page).toHaveURL("/places?region=goseong");
    await expect(regionSelect).toHaveValue("goseong");
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_REGION_PLACES.goseong.name) })).toBeVisible();
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_PLACE.name) })).toBeHidden();
    // 지역을 바꾸면 GA로 센다(고성·양양을 더 넓힐지 정하는 근거, 2026-11-22).
    await expect.poll(() => analyticsEventParams(page, "place_region_changed")).toEqual([{ region: "goseong", surface: "place_list" }]);
    // 고성에 장소가 없는 분류(물놀이·온천)는 칩도 숨긴다.
    await expect(page.getByRole("navigation", { name: "가볼만한 곳 분류" }).getByRole("link", { name: SAMPLE_PLACE.categoryLabel })).toBeHidden();

    // 주소가 인제군인 진부령미술관도 고성에 들어간다(2026-11-22 사용자 결정).
    await page.getByRole("navigation", { name: "가볼만한 곳 분류" }).getByRole("link", { name: "전시·박물관" }).click();
    await expect(page).toHaveURL(`/places/category/${SAMPLE_REGION_PLACES.goseongOutsideAddress.category}?region=goseong`);
    await expect(regionSelect).toHaveValue("goseong");
    await main.getByRole("link", { name: new RegExp(SAMPLE_REGION_PLACES.goseongOutsideAddress.name) }).click();
    await expect(page).toHaveURL(SAMPLE_REGION_PLACES.goseongOutsideAddress.path);

    await page.getByRole("main").getByRole("link", { name: "목록으로 돌아가기" }).first().click();
    await expect(page).toHaveURL(`/places/category/${SAMPLE_REGION_PLACES.goseongOutsideAddress.category}?region=goseong`);
    await expect(regionSelect).toHaveValue("goseong");
  });

  test("전체 지역을 고르면 주소에 all이 남고 모든 지역 장소가 보이며, 속초를 다시 고르면 주소에서 빠진다", async ({ page }) => {
    await page.goto("/places");
    const main = page.getByRole("main");
    const regionSelect = main.getByRole("combobox", { name: "지역" });
    await regionSelect.selectOption("all");
    await expect(page).toHaveURL("/places?region=all");
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_REGION_PLACES.yangyang.name) })).toBeVisible();
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_PLACE.name) })).toBeVisible();
    await regionSelect.selectOption("sokcho");
    await expect(page).toHaveURL("/places");
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_REGION_PLACES.yangyang.name) })).toBeHidden();
  });

  // 정적 목록의 첫 HTML은 속초가 골라져 있다. select 뒤의 inline script가 첫 그리기 전에 주소의 지역을 넣어 공유 링크에서 깜빡이지 않는다(2026-11-22).
  // React가 붙기 전 상태를 보려고 Next.js 스크립트를 막는다(inline script는 HTML 안에 있어 그대로 돈다).
  test("고성 공유 링크로 들어오면 앱 스크립트를 불러오기 전에도 고성 목록이 보인다", async ({ page }) => {
    await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
    await page.goto("/places?region=goseong");
    const main = page.getByRole("main");
    await expect(main.getByRole("combobox", { name: "지역" })).toHaveValue("goseong");
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_REGION_PLACES.goseong.name) })).toBeVisible();
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_PLACE.name) })).toBeHidden();
  });

  test("고성 장소 상세에 바로 들어오면 목록으로 돌아가기가 고성 목록으로 간다", async ({ page }) => {
    await page.goto(SAMPLE_REGION_PLACES.goseong.path);
    // 상세 조회에 장소 지역을 붙인다(고성·양양 장소 조회를 slug 없이 나눠 봄, 2026-11-22).
    await expect.poll(() => analyticsEventParams(page, "place_detail_viewed")).toEqual([
      expect.objectContaining({ place_region: "goseong" }),
    ]);
    const backToList = page.getByRole("main").getByRole("link", { name: "목록으로 돌아가기" }).first();
    await expect(backToList).toHaveAttribute("href", "/places?region=goseong");
    await backToList.click();
    await expect(page).toHaveURL("/places?region=goseong");
    await expect(page.getByRole("main").getByRole("combobox", { name: "지역" })).toHaveValue("goseong");
  });

  test("주소에 지역이 있으면 그 지역만 보이고, 그 지역에 그 분류가 없으면 빈 안내와 전체 지역 보기를 보인다", async ({ page }) => {
    const response = await page.goto(`/places/category/${SAMPLE_PLACE.category}?region=yangyang`);
    expect(response?.status()).toBe(200);
    const main = page.getByRole("main");
    await expect(main.getByText("양양에는 아직 올라온 곳이 없어요.")).toBeVisible();
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_PLACE.name) })).toBeHidden();
    await main.getByRole("link", { name: "전체 지역 보기" }).click();
    await expect(page).toHaveURL(`/places/category/${SAMPLE_PLACE.category}?region=all`);
    await expect(main.getByRole("link", { name: new RegExp(SAMPLE_PLACE.name) })).toBeVisible();
    await expect(main.getByText("양양에는 아직 올라온 곳이 없어요.")).toBeHidden();
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

  // 버튼은 공식 홈페이지(primary) → 예매하기 → 길찾기 순서다(.ai/DESIGN.md 가볼만한 곳 상세). 넓은 화면에서 예매하기가 먼저 놓이던 것을 고쳤다(2026-11-22).
  test("예매처가 있는 장소의 버튼은 공식 홈페이지 → 예매하기 → 길찾기 순서다", async ({ page }, testInfo) => {
    await page.goto("/places/alive-heart-sokcho");
    const main = page.getByRole("main");
    const links = [/공식 홈페이지/, /예매하기/, /길찾기/].map((name) => main.getByRole("link", { name }));
    const boxes = await Promise.all(links.map(async (link) => (await link.boundingBox())!));
    if (testInfo.project.name === "desktop-chromium") {
      // 한 줄에 나란히: 왼쪽부터
      expect(boxes[0].x).toBeLessThan(boxes[1].x);
      expect(boxes[1].x).toBeLessThan(boxes[2].x);
    } else {
      // 모바일: 공식 홈페이지가 맨 위 한 줄, 그 아래에 예매하기·길찾기
      expect(boxes[0].y).toBeLessThan(boxes[1].y);
      expect(boxes[1].x).toBeLessThan(boxes[2].x);
    }
  });

  test("상세를 열고 공식 홈페이지를 누르면 GA 이벤트를 보낸다", async ({ page }) => {
    await page.goto(SAMPLE_PLACE.path);
    await expect.poll(() => analyticsEventParams(page, "place_detail_viewed")).toEqual([
      { place_slug: SAMPLE_PLACE.slug, place_category: SAMPLE_PLACE.category, place_region: "sokcho" },
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

  // 공유 미리보기 이미지가 비지 않고, 상세 설명은 바뀌는 운영시간 원문 대신 확인할 항목만 알린다(2026-11-21 SEO 점검).
  test("목록·분류에는 공유 이미지가 있고, 상세 설명은 이름과 소개로 시작한다", async ({ request }) => {
    for (const path of ["/places", `/places/category/${SAMPLE_PLACE.category}`]) {
      const html = await (await request.get(path)).text();
      expect(html, path).toMatch(/<meta property="og:image" content="[^"]+"/);
    }
    const detail = await (await request.get(SAMPLE_PLACE.path)).text();
    expect(detail).toContain(`<meta name="description" content="속초 ${SAMPLE_PLACE.name}:`);
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

    // 검색 결과를 실제로 눌렀는지 GA로 센다(2026-11-21). 결과 수(site_search_viewed)만으로는 검색이 쓸모 있는지 알 수 없다.
    await page.getByRole("region", { name: "가볼만한 곳" }).getByRole("link", { name: new RegExp(SAMPLE_PLACE.name) }).click();
    await expect(page).toHaveURL(SAMPLE_PLACE.path);
    await expect.poll(() => analyticsEventParams(page, "select_content")).toContainEqual(
      expect.objectContaining({ content_type: "place", content_source: "site_search", place_category: SAMPLE_PLACE.category }),
    );
  });

  // 하단 탭은 검색창에 입력하는 동안만 숨긴다(2026-11-22 사용자 결정, 아래 "입력하는 동안만" test).
  test("가볼만한 곳 범위에서 결과가 여러 지역이면 지역 select로 좁힌다", async ({ page }) => {
    await page.goto("/search?q=%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5&type=places");
    const places = page.getByRole("region", { name: "가볼만한 곳" });
    await expect(places.getByRole("link", { name: new RegExp(SAMPLE_REGION_PLACES.yangyang.name) })).toBeVisible();
    const regionSelect = page.getByRole("main").getByRole("combobox", { name: "지역" });
    await regionSelect.selectOption("goseong");
    await expect(page).toHaveURL(/q=%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5/);
    await expect(page).toHaveURL(/type=places/);
    await expect(page).toHaveURL(/region=goseong/);
    await expect(places.getByRole("link", { name: new RegExp(SAMPLE_REGION_PLACES.yangyang.name) })).toHaveCount(0);
    await expect(regionSelect).toHaveValue("goseong");

    // 범위를 "전체"로 바꾸면 지역도 풀린다(지역은 가볼만한 곳 범위에서만 쓴다).
    await page.getByRole("navigation", { name: "검색 범위" }).getByRole("link", { name: /^전체/ }).click();
    await expect(page).not.toHaveURL(/region=/);
    await expect(regionSelect).toHaveCount(0);
  });

  test("결과가 없으면 다시 찾을 방법을 알려 준다", async ({ page }) => {
    await page.goto("/search?q=%EC%97%86%EB%8A%94%EC%9E%A5%EC%86%8C%EC%9D%B4%EB%A6%84");
    await expect(page.getByText("에 맞는 행사나 장소가 없어요.")).toBeVisible();
    await expect.poll(() => analyticsEventParams(page, "site_search_viewed")).toEqual([{ query_length: 6, event_count: 0, place_count: 0 }]);
  });

  // 결과를 보던 방문자가 다른 탭으로 갈 수 있게, 키보드가 열리는 입력 중에만 하단 탭을 숨긴다(2026-11-22 리뷰, 사용자 결정).
  test("검색 결과 화면에서는 하단 탭이 보이고, 검색창에 입력하는 동안만 숨긴다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "하단 탭은 md 미만에서만 보인다");
    await page.goto("/search?q=%EC%9B%8C%ED%84%B0");
    await expect(page.getByRole("region", { name: "가볼만한 곳" })).toBeVisible();
    const bottomNav = page.locator("[data-bottom-nav]");
    await expect(bottomNav).toBeVisible();

    await page.getByRole("main").getByRole("search", { name: "사이트 검색" }).getByRole("textbox").focus();
    await expect(bottomNav).toBeHidden();
  });

  // 검색어 없이 열면 인기 행사 대신 최근 검색어를 보인다(2026-11-21 사용자 결정). 기록은 이 브라우저에만 남는다.
  test("처음에는 최근 검색 내역이 없다고 알리고, 검색한 말은 다시 누르거나 지울 수 있다", async ({ page }) => {
    await page.goto("/search");
    const recent = page.getByRole("region", { name: "최근 검색어" });
    await expect(recent.getByText("최근 검색 내역이 없어요.")).toBeVisible();

    const field = page.getByRole("main").getByRole("search", { name: "사이트 검색" }).getByRole("textbox");
    await field.fill("워터");
    await field.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=%EC%9B%8C%ED%84%B0/);

    await page.goto("/search");
    await recent.getByRole("link", { name: "워터" }).click();
    await expect(page).toHaveURL(/\/search\?q=%EC%9B%8C%ED%84%B0/);
    await expect(field).toHaveValue("워터");

    await page.goto("/search");
    await recent.getByRole("button", { name: "최근 검색어 워터 삭제" }).click();
    await expect(recent.getByText("최근 검색 내역이 없어요.")).toBeVisible();
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
    // 카드에도 목록 줄처럼 분류 옆에 지역을 적는다(2026-11-22 리뷰).
    await expect(panel.getByText("전망·탈것 · 속초")).toBeVisible();
    await panel.getByRole("link", { name: "자세히 보기" }).click();
    await expect(page).toHaveURL(SAMPLE_PHOTO_PLACE.path);
  });

  // 지도는 지역으로 거르지 않고 속초·고성·양양 장소를 모두 보인다. 어디인지는 카드와 목록 판의 지역 이름이 알려 준다(2026-11-22 사용자 결정).
  test("가볼만한 곳 레이어는 지역 select 없이 고성 장소 핀도 보이고, 주소의 region은 무시한다", async ({ page }) => {
    await page.goto("/map?layer=places&region=yangyang");
    await expect(page.getByRole("combobox", { name: "지역" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `${SAMPLE_PHOTO_PLACE.name}, 가볼만한 곳` })).toBeVisible();
    await expect(page.getByRole("button", { name: `${SAMPLE_REGION_PLACES.goseongOutsideAddress.name}, 가볼만한 곳` })).toHaveCount(1);
    // 분류를 바꾸면 주소를 다시 쓰면서 예전 region 값이 빠진다.
    await page.getByRole("group", { name: "지도 분야" }).getByRole("button", { name: "전시·박물관" }).click();
    await expect(page).toHaveURL(/category=exhibition/);
    await expect(page).not.toHaveURL(/region=/);
  });

  test("md 이상 왼쪽 목록 판 줄에 분류와 지역이 함께 보인다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "왼쪽 목록 판은 md 이상에만 있다");
    await page.goto("/map?layer=places");
    const list = page.getByRole("list", { name: "지도에 보이는 곳" });
    await expect(list.getByRole("button", { name: new RegExp(SAMPLE_REGION_PLACES.goseongOutsideAddress.name) })).toContainText("전시·박물관 · 고성");
    // 속초를 먼저 놓는다(속초 → 고성 → 양양, 2026-11-22 사용자 요청). 지도 위 화면 순서(북쪽부터)면 고성이 맨 위였다.
    await expect(list.getByRole("button").first()).toContainText("· 속초");
    await expect(list.getByRole("button").last()).toContainText("· 양양");
    await list.getByRole("button").first().click();
    await expect.poll(() => analyticsEventParams(page, "map_place_selected")).toEqual([expect.objectContaining({ select_method: "list" })]);
  });

  // 가볼만한 곳은 처음에 속초 시내 기본 보기(확대 13)로 열고 핀에 맞추지 않는다. 모든 핀에 맞추면 고성 남쪽~양양까지 넓게 보였다(2026-11-22 사용자 피드백).
  test("가볼만한 곳 레이어는 처음에 핀 맞추기 없이 속초 시내 기본 보기로 열고, 분야를 고르면 그 분야 핀에 맞춘다", async ({ page }) => {
    await page.goto("/map?layer=places");
    await expect(page.getByRole("button", { name: `${SAMPLE_PHOTO_PLACE.name}, 가볼만한 곳` })).toBeVisible();
    function view() {
      return page.evaluate(() => {
        const map = (window as unknown as { __fakeNaverMaps?: { zoom: number; fitBoundsCount?: number; center: { lat(): number } }[] }).__fakeNaverMaps?.at(-1);
        return map ? { zoom: map.zoom, fits: map.fitBoundsCount ?? 0, latitude: Number(map.center.lat().toFixed(3)) } : null;
      });
    }
    await expect.poll(view).toEqual({ zoom: 13, fits: 0, latitude: 38.207 });

    await page.getByRole("group", { name: "지도 분야" }).getByRole("button", { name: "전시·박물관" }).click();
    await expect.poll(async () => (await view())?.fits).toBe(1);
    // 전체로 돌리면 다시 속초 시내 기본 보기다.
    await page.getByRole("group", { name: "지도 분야" }).getByRole("button", { name: "전체" }).click();
    await expect.poll(view).toEqual({ zoom: 13, fits: 1, latitude: 38.207 });
  });

  test("행사 레이어에도 지역 select가 없다", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByRole("group", { name: "지도 분야" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "지역" })).toHaveCount(0);
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

  // 공지 띠를 둘지 판단하려면 띠를 본 사람 수(분모)가 필요하다. 닫은 방문자는 띠가 숨겨져 세지 않는다(2026-11-22 사용자 결정).
  test("공지 띠가 보이면 GA에 한 번 알리고, 닫은 뒤 다시 열면 알리지 않는다", async ({ page }) => {
    await page.goto("/report");
    const banner = page.getByRole("complementary", { name: "새 공지" });
    await expect(banner).toBeVisible();
    await expect.poll(() => analyticsEventParams(page, "notice_banner_viewed")).toEqual([
      expect.objectContaining({ notice_id: expect.any(String), notice_kind: expect.any(String) }),
    ]);
    await page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name: "가볼만한 곳", exact: true }).click();
    await expect(page).toHaveURL(/\/places$/);
    expect(await analyticsEventParams(page, "notice_banner_viewed")).toHaveLength(1);

    await banner.getByRole("button", { name: "공지 닫기" }).click();
    await page.goto("/report");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await analyticsEventParams(page, "notice_banner_viewed")).toHaveLength(0);
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
    // 띠가 읽히는지(클릭)와 거슬리는지(닫기)를 GA로 센다(2026-11-21).
    await expect.poll(async () => (await analyticsEventParams(page, "notice_banner_clicked")).length).toBe(1);

    await banner.getByRole("button", { name: "공지 닫기" }).click();
    await expect(banner).toHaveCount(0);
    await expect.poll(async () => (await analyticsEventParams(page, "notice_banner_dismissed")).length).toBe(1);

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

test.describe("관리자 장소 저장", () => {
  // 관리자 폼의 가볼만한 곳 칸(분류·운영 상태·태그·운영시간·확인일)이 저장돼 공개 상세에 그대로 보이고,
  // 지우면 상세가 닫히는지 본다. 그 전에는 입력 검증 단위 test만 있었다(2026-11-21 리뷰).
  test("관리자가 가볼만한 곳 값을 넣어 장소를 만들면 상세에 보이고, 지우면 상세가 닫힌다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "DB를 바꾸는 흐름은 한 프로젝트에서만 실행한다");
    const stamp = Date.now();
    const name = `E2E 장소 ${stamp}`;
    const slug = `e2e-place-${stamp}`;

    await loginAsAdmin(page);
    await page.goto("/admin/places/new");
    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('input[name="category"]').fill("체험시설");
    await page.locator('input[name="latitude"]').fill("38.2");
    await page.locator('input[name="longitude"]').fill("128.59");
    await page.locator('input[name="isPublished"]').check();
    await page.locator('select[name="activityCategory"]').selectOption("experience");
    await page.locator('select[name="operationStatus"]').selectOption("seasonal_closed");
    await page.locator('input[name="tags"][value="indoor"]').check();
    await page.locator('input[name="statusNote"]').fill("겨울에는 쉬어요.");
    await page.locator('textarea[name="hoursSummary"]').fill("매일 10:00~18:00");
    await page.locator('input[name="verifiedOn"]').fill("2026-11-21");
    await page.getByRole("button", { name: "명소 저장" }).click();
    await expect(page).toHaveURL(/\/admin\/places\/[0-9a-f-]{36}\?result=place-saved$/);
    await expect(page.getByText("명소 정보를 저장했습니다.")).toBeVisible();
    const editUrl = page.url();

    await page.goto(`/places/${slug}`);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(main.getByText("체험 · 실내")).toBeVisible();
    await expect(main.getByText("시즌 휴장")).toBeVisible();
    await expect(main.getByText("겨울에는 쉬어요.")).toBeVisible();
    await expect(main.getByText("매일 10:00~18:00")).toBeVisible();
    await expect(main.getByText("2026년 11월 확인")).toBeVisible();

    await page.goto(editUrl);
    await page.getByRole("button", { name: "명소 삭제" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "명소 삭제" }).click();
    await expect(page).toHaveURL(/\/admin\?tab=places&result=place-deleted$/);

    const response = await page.goto(`/places/${slug}`);
    expect(response?.status()).toBe(404);
  });
});
