import { devices, expect, test, type Page } from "@playwright/test";
import { analyticsEventParams } from "@/tests/e2e/fixtures";
import { routeFakeNaverMaps } from "@/tests/e2e/naver-maps-stub";

// 지도 탭(/map, .ai/DESIGN.md 지도). 네이버 지도 SDK는 외부 서비스라 가짜 SDK(naver-maps-stub.ts)로 바꿔 끼워
// 헤더 입구, 분야 칩과 주소, 핀과 장소 카드, 화면 폭을 확인한다. 지도 그림 자체(타일, 확대 버튼 위치)는 개발 서버에서 직접 본다.
const categoryNames = ["전체", "공연", "축제", "체험", "교육", "전시", "기타"];
/** supabase/seed.sql의 "[샘플] 산과 사람 기획전"(전시) 장소. 장소 사전의 시설 이름이 핀 이름이다. */
const MOUNTAIN_PIN_NAME = /^국립산악박물관, 행사 \d+개$/;
const MOUNTAIN_PLACE_NAME = "국립산악박물관";

test.beforeEach(async ({ page }) => {
  await routeFakeNaverMaps(page);
});

/** 홈에서 헤더의 지도 버튼으로 들어온다. 뒤로 가기가 지도 탭 앞 페이지(홈)로 가는지 보려고 쓴다. */
async function openMapFromHome(page: Page) {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "지도" }).click();
  await expect(page).toHaveURL(/\/map$/);
}

function getPlacePanel(page: Page) {
  return page.getByRole("region", { name: MOUNTAIN_PLACE_NAME });
}

test.describe("장소 카드", () => {
  test("핀을 누르면 카드가 열리고, 닫으면 핀으로 초점이 돌아오며 기록이 한 칸도 남지 않는다", async ({ page }) => {
    await openMapFromHome(page);
    const pin = page.getByRole("button", { name: MOUNTAIN_PIN_NAME });

    await pin.click();
    await expect(page).toHaveURL(/\/map\?place=/);
    await expect(getPlacePanel(page)).toBeVisible();
    await expect(getPlacePanel(page).getByRole("heading", { name: MOUNTAIN_PLACE_NAME })).toBeFocused();

    // 이미 고른 핀을 다시 눌러도 장소를 다시 고른 것으로 세지 않는다.
    await pin.click();
    await getPlacePanel(page).getByRole("button", { name: "닫기" }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(getPlacePanel(page)).toBeHidden();
    await expect(pin).toBeFocused();
    expect(await analyticsEventParams(page, "map_place_selected")).toEqual([{ map_category: "all", event_count: 1 }]);

    await page.goBack();
    await expect(page).toHaveURL(/:\d+\/$/);
  });

  // 핀을 고른 채 지도의 빈 곳을 누르면 고른 것을 푼다(2026-11-21 사용자 요청).
  test("고른 채 지도의 빈 곳을 누르면 카드를 닫고 고른 표시와 초점을 없앤다", async ({ page }) => {
    await page.goto("/map");
    const pin = page.getByRole("button", { name: MOUNTAIN_PIN_NAME });
    await pin.click();
    await expect(getPlacePanel(page)).toBeVisible();

    // 가짜 지도는 마커를 오른쪽 위부터 늘어놓는다. 마커 줄 아래와 장소 카드 위 사이의 오른쪽 빈 곳을 누른다
    // (장소 카드는 모바일은 아래 시트, md 이상은 왼쪽 판이라 판의 위쪽은 화면 맨 위 근처다).
    const panelBox = await getPlacePanel(page).boundingBox();
    const markersBottom = await page.evaluate(() =>
      Math.max(...[...document.querySelectorAll("[data-fake-marker]")].map((marker) => marker.getBoundingClientRect().bottom)));
    const viewportSize = page.viewportSize();
    const panelTop = panelBox !== null && panelBox.y > markersBottom ? panelBox.y : (viewportSize?.height ?? markersBottom + 80);
    await page.mouse.click((viewportSize?.width ?? 360) - 24, (markersBottom + panelTop) / 2);

    await expect(page).toHaveURL(/\/map$/);
    await expect(getPlacePanel(page)).toBeHidden();
    await expect(pin).toHaveAttribute("aria-pressed", "false");
    await expect(pin).not.toBeFocused();
  });

  test("카드를 연 뒤 분야를 바꾸고 닫아도 고른 분야가 남는다", async ({ page }) => {
    await page.goto("/map");
    await page.getByRole("button", { name: MOUNTAIN_PIN_NAME }).click();
    const categories = page.getByRole("group", { name: "지도 분야" });

    await categories.getByRole("button", { name: "전시" }).click();
    await expect(page).toHaveURL(/\/map\?category=exhibition&place=/);
    await getPlacePanel(page).getByRole("button", { name: "닫기" }).click();

    await expect(page).toHaveURL(/\/map\?category=exhibition$/);
    await expect(categories.getByRole("button", { name: "전시" })).toHaveAttribute("aria-pressed", "true");
  });

  test("상세에서 뒤로 오면 같은 카드가 열려 있고, 닫은 뒤 뒤로 가기는 지도 앞 페이지로 간다", async ({ page }) => {
    await openMapFromHome(page);
    await page.getByRole("button", { name: MOUNTAIN_PIN_NAME }).click();
    await getPlacePanel(page).getByRole("link").first().click();
    await expect(page).toHaveURL(/\/events\//);

    await page.goBack();
    await expect(page).toHaveURL(/\/map\?place=/);
    await expect(getPlacePanel(page)).toBeVisible();

    await getPlacePanel(page).getByRole("button", { name: "닫기" }).click();
    await expect(page).toHaveURL(/\/map$/);
    await page.goBack();
    await expect(page).toHaveURL(/:\d+\/$/);
  });

  test("브라우저 뒤로 가기와 Esc로도 카드를 닫는다", async ({ page }) => {
    await openMapFromHome(page);
    await page.getByRole("button", { name: MOUNTAIN_PIN_NAME }).click();
    await page.goBack();
    await expect(page).toHaveURL(/\/map$/);
    await expect(getPlacePanel(page)).toBeHidden();

    await page.getByRole("button", { name: MOUNTAIN_PIN_NAME }).click();
    await expect(getPlacePanel(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/map$/);
    await expect(getPlacePanel(page)).toBeHidden();
  });

  test("주소의 장소로 열면 카드가 열려 있고, 지도에 없는 장소는 주소에서 뺀다", async ({ page }) => {
    await page.goto("/map");
    await page.getByRole("button", { name: MOUNTAIN_PIN_NAME }).click();
    await expect(page).toHaveURL(/\/map\?place=/);
    const placeUrl = page.url();

    await page.goto(placeUrl);
    await expect(getPlacePanel(page)).toBeVisible();

    await page.goto("/map?category=festival&place=0,0");
    await expect(page).toHaveURL(/\/map\?category=festival$/);
  });
});

test("헤더의 지도 버튼으로 지도 탭에 들어가 분야를 고를 수 있다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "지도" }).click();
  await expect(page).toHaveURL(/\/map$/);

  const categories = page.getByRole("group", { name: "지도 분야" });
  await expect(categories.getByRole("button")).toHaveText(categoryNames);
  await expect(categories.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");

  // 고른 분야는 주소에 남아 상세에서 뒤로 와도 그대로다.
  await categories.getByRole("button", { name: "교육" }).click();
  await expect(page).toHaveURL(/\/map\?category=education$/);
  await expect(categories.getByRole("button", { name: "교육" })).toHaveAttribute("aria-pressed", "true");
  await expect(categories.locator('[aria-pressed="true"]')).toHaveCount(1);

  await categories.getByRole("button", { name: "전체" }).click();
  await expect(page).toHaveURL(/\/map$/);
});

// 분야를 바꿀 때 마커를 지웠다 다시 만들지 않고 보이기만 바꾼다(핀이 30~50개로 늘 때를 대비, 2026-11-16). 바꿔도 고른 분야의 핀만 남아야 한다.
test("분야를 고르면 그 분야 행사가 있는 핀만 남고, 전체로 돌아오면 모두 다시 보인다", async ({ page }) => {
  await page.goto("/map");
  const pins = page.getByRole("button", { name: /, 행사 \d+개$/ });
  await expect(pins.first()).toBeVisible();
  const allPinCount = await pins.count();
  expect(allPinCount).toBeGreaterThan(1);
  const categories = page.getByRole("group", { name: "지도 분야" });

  await categories.getByRole("button", { name: "전시" }).click();
  await expect(pins).toHaveCount(1);
  await expect(page.getByRole("button", { name: MOUNTAIN_PIN_NAME })).toBeVisible();

  await categories.getByRole("button", { name: "전체" }).click();
  await expect(pins).toHaveCount(allPinCount);
});

// 지도 분야 칩을 남길지 정하려고, 실제로 분야를 바꾼 것만 센다(이미 고른 칩을 다시 누른 것은 세지 않음, 2026-11-16).
test("지도 분야 칩으로 분야를 바꾸면 GA에 바꾼 분야를 한 번씩 보낸다", async ({ page }) => {
  await page.goto("/map");
  const categories = page.getByRole("group", { name: "지도 분야" });

  await categories.getByRole("button", { name: "교육" }).click();
  await expect(page).toHaveURL(/category=education/);
  await categories.getByRole("button", { name: "교육" }).click();
  await categories.getByRole("button", { name: "전체" }).click();
  await expect(page).toHaveURL(/\/map$/);

  await expect.poll(() => analyticsEventParams(page, "map_category_changed")).toEqual([
    { map_category: "education" },
    { map_category: "all" },
  ]);
});

// 운영에서 지도 키를 빠뜨리거나 SDK를 불러오지 못하면 안내 문구만 보여 조용히 죽어 있게 된다. 그때를 GA로 알 수 있게 한다(2026-11-16).
test("지도를 불러오지 못하면 안내를 보여 주고 GA에 이유를 한 번 보낸다", async ({ page }) => {
  await page.route("**/oapi.map.naver.com/**", (route) => route.abort());
  await page.goto("/map");

  await expect(page.getByText("지금은 지도를 볼 수 없어요.")).toBeVisible();
  // E2E는 가짜 Client ID로 빌드하므로(playwright.config.ts) 키 없음이 아니라 스크립트 오류다(2026-11-16).
  await expect.poll(() => analyticsEventParams(page, "map_unavailable")).toEqual([{ reason: "script_error" }]);
});

// SDK는 처음 불러올 때 한 번만 인증 실패를 알린다. 다른 페이지에 갔다 와도(스크립트를 다시 받지 않음) 안내가 남아야 한다(2026-11-16 리뷰).
test("지도 인증에 실패하면 다른 페이지에 다녀와도 안내를 보여 준다", async ({ page }) => {
  await routeFakeNaverMaps(page, { authFailure: true });
  await openMapFromHome(page);
  await expect(page.getByText("지금은 지도를 볼 수 없어요.")).toBeVisible();

  await page.getByRole("banner").getByRole("link", { name: "속초모아" }).click();
  await expect(page).toHaveURL(/:\d+\/$/);
  await page.getByRole("banner").getByRole("link", { name: "지도" }).click();

  await expect(page.getByText("지금은 지도를 볼 수 없어요.")).toBeVisible();
  await expect.poll(() => analyticsEventParams(page, "map_unavailable")).toEqual([{ reason: "auth_failed" }, { reason: "auth_failed" }]);
});

test("주소의 분야로 지도 탭을 열면 그 분야가 골라져 있다", async ({ page }) => {
  await page.goto("/map?category=festival");

  const categories = page.getByRole("group", { name: "지도 분야" });
  await expect(categories.getByRole("button", { name: "축제" })).toHaveAttribute("aria-pressed", "true");
});

const galaxy = devices["Galaxy S24"];
const viewports = [
  {
    name: "360px 모바일",
    options: { viewport: galaxy.viewport, userAgent: galaxy.userAgent, deviceScaleFactor: galaxy.deviceScaleFactor, isMobile: galaxy.isMobile, hasTouch: galaxy.hasTouch },
  },
  { name: "768px 태블릿", options: { viewport: { width: 768, height: 1024 } } },
];

for (const { name, options } of viewports) {
  test.describe(name, () => {
    test.use(options);

    // 360px에서 로고·행사 지도·월별 일정 버튼이 한 줄에 들어가지 않으면 버튼 글자가 두 줄로 꺾이거나 화면이 넘친다(2026-11-16).
    test("지도 탭이 가로로 넘치지 않고 헤더 버튼이 한 줄로 보인다", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium", "화면 폭을 직접 지정하므로 프로젝트마다 반복하지 않는다");

      await page.goto("/map");
      await expect(page.getByRole("group", { name: "지도 분야" })).toBeVisible();

      const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);

      for (const label of ["지도", "월별 일정"]) {
        const box = await page.getByRole("banner").getByRole("link", { name: label }).boundingBox();
        // 버튼 높이 44px. 글자가 두 줄로 꺾이면 이보다 커진다.
        expect(box?.height).toBeLessThanOrEqual(48);
      }
    });

    // 지도가 헤더 아래를 꽉 채우는 앱 화면이라 푸터를 두지 않는다. 있으면 칩·헤더를 끌 때 페이지가 스크롤돼 지도가 밀렸다(2026-11-16 사용자 결정).
    test("지도 탭은 화면보다 길지 않고, 장소 카드를 열어도 넘치지 않는다", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium", "화면 폭을 직접 지정하므로 프로젝트마다 반복하지 않는다");

      await page.goto("/map");
      await expect(page.getByRole("contentinfo")).toBeHidden();
      await page.getByRole("button", { name: MOUNTAIN_PIN_NAME }).click();
      await expect(getPlacePanel(page)).toBeVisible();

      const size = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
      }));
      expect(size.documentWidth).toBeLessThanOrEqual(size.viewportWidth);
      // 헤더 높이 변수에 테두리 1px이 빠져 있을 때는 1px 길어 페이지가 스크롤됐다(2026-11-16).
      expect(size.documentHeight).toBeLessThanOrEqual(size.viewportHeight);
    });
  });
}
