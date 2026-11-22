import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  analyticsEventParams,
  capturedAnalyticsEvents,
  SAMPLE_EVENT_PATH,
  SAMPLE_EVENT_SLUG,
  searchFromHeader,
} from "@/tests/e2e/fixtures";

interface ElementBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function visibleBox(locator: Locator): Promise<ElementBox> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function expectNoHorizontalOverflow(page: Page, locators: Locator[]) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));

  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 1);

  for (const locator of locators) {
    const box = await visibleBox(locator);
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(widths.viewport + 1);
  }
}

test("없는 페이지와 없는 행사를 각각 이해하기 쉬운 화면으로 안내한다", async ({ page }) => {
  await page.goto("/존재하지-않는-페이지");
  await expect(page.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없어요." })).toBeVisible();
  await expect(page.getByRole("link", { name: "행사 목록으로" })).toHaveAttribute("href", "/");

  await page.goto("/events/존재하지-않는-행사");
  await expect(page.getByRole("heading", { level: 1, name: "공개된 행사를 찾을 수 없어요." })).toBeVisible();
  await expect(page.getByText(/비공개로 전환됐거나 주소가 바뀌었을 수 있습니다/)).toBeVisible();
});

// GPTBot·ClaudeBot·PerplexityBot처럼 JS를 실행하지 않는 크롤러는 받은 HTML만 읽는다. 로딩 화면을 먼저 보내고
// 본문을 푸터 뒤 숨김 영역에 붙이면 본문을 못 찾을 수 있어, 첫 HTML에서 본문이 제자리에 있는지 지킨다(2026-11-15).
test("행사 상세 HTML은 JS를 실행하지 않아도 본문이 푸터보다 먼저 온다", async ({ request }) => {
  const response = await request.get(SAMPLE_EVENT_PATH);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const headingIndex = html.indexOf("<h1");

  expect(headingIndex).toBeGreaterThan(-1);
  expect(headingIndex).toBeLessThan(html.indexOf("<footer"));
});

// 홈과 분야 목록도 같은 이유로 지킨다. 목록에 로딩 화면이 있으면 제목과 카드 목록이 푸터 뒤 숨김 영역으로 갔다(2026-11-15).
test("홈과 분야 목록 HTML은 JS를 실행하지 않아도 제목과 행사 목록이 푸터보다 먼저 온다", async ({ request }) => {
  for (const path of ["/", "/topics/festival"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const footerIndex = html.indexOf("<footer");
    const headingIndex = html.indexOf("<h1");
    const resultsIndex = html.indexOf('aria-labelledby="event-results-title"');

    expect(headingIndex, path).toBeGreaterThan(-1);
    expect(headingIndex, path).toBeLessThan(footerIndex);
    expect(resultsIndex, path).toBeGreaterThan(-1);
    expect(resultsIndex, path).toBeLessThan(footerIndex);
  }
});

// 네이버 서치어드바이저에 제출하는 새 행사 RSS. 홈의 link 태그로도 주소를 알린다(2026-11-15).
test("RSS는 공개 행사 상세 주소를 담고, 홈이 RSS 주소를 알린다", async ({ page, request }) => {
  const response = await request.get("/rss.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/rss+xml; charset=utf-8");
  expect(await response.text()).toContain(`${SAMPLE_EVENT_PATH}</link>`);

  await page.goto("/");
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute("href", /\/rss\.xml$/);
});

test("행사 상세의 날짜는 기계가 읽는 서울 날짜를 함께 담는다", async ({ page }) => {
  await page.goto(SAMPLE_EVENT_PATH);
  const eventDate = page.getByRole("region", { name: "핵심 정보" }).locator("time").first();

  await expect(eventDate).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
});

test("행사 상세는 지도 SDK나 인라인 미리보기 없이 장소·주소·외부 링크를 제공한다", async ({ page }) => {
  const mapSdkRequests: string[] = [];
  page.on("request", (request) => {
    const hostname = new URL(request.url()).hostname;
    if (hostname === "oapi.map.naver.com" || hostname === "dapi.kakao.com") {
      mapSdkRequests.push(request.url());
    }
  });

  await page.goto(SAMPLE_EVENT_PATH);

  const factsSection = page.getByRole("region", { name: "핵심 정보" });
  await expect(factsSection.getByText("강원특별자치도 속초시 해오름로 190", { exact: true })).toBeVisible();

  const mapLink = factsSection.getByRole("link", { name: /네이버 지도/ });
  await expect(mapLink).toBeVisible();
  await expect(mapLink).toHaveAttribute("href", /^https:\/\/map\.naver\.com\/p\/search\//);
  await expect(mapLink).toHaveAttribute("target", "_blank");
  await expect(mapLink).toHaveAttribute("rel", "noreferrer");
  await expect(mapLink).toHaveAccessibleName("네이버 지도 (새 창)");

  await page.waitForLoadState("networkidle");
  await page.evaluate(() => new Promise<void>((resolve) => {
    function settle() {
      window.setTimeout(resolve, 100);
    }
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(settle, { timeout: 500 });
    } else {
      settle();
    }
  }));

  await expect(factsSection.locator("iframe")).toHaveCount(0);
  await expect(page.locator('script[src*="oapi.map.naver.com"], script[src*="dapi.kakao.com"]')).toHaveCount(0);
  expect(mapSdkRequests).toEqual([]);
});

test("공유하기는 기기에 맞는 방식으로 행사 주소를 공유하고, 링크 복사만 완료로 알린다", async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name === "mobile-chromium";

  await page.addInitScript((mobile) => {
    type ShareCapture = Window & { __copiedEventUrl?: string; __sharedEventUrl?: string };
    const capture = window as ShareCapture;

    if (mobile) {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: ({ url }: { url?: string }) => {
          capture.__sharedEventUrl = url;
          return Promise.resolve();
        },
      });
      Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
      return;
    }

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (url: string) => {
          capture.__copiedEventUrl = url;
          return Promise.resolve();
        },
      },
    });
  }, isMobile);

  await page.goto(`${SAMPLE_EVENT_PATH}?from=search#facts-title`);
  const shareButton = page.getByRole("button", { name: "공유하기" });
  await expect(shareButton).toBeVisible();
  await shareButton.click();

  // 받은 사람이 들어오면 GA가 공유 유입으로 세도록 공유 꼬리표를 붙인다(2026-11-17). 원래 주소의 쿼리·해시는 버린다.
  const expectedUrl = `http://127.0.0.1:3100${SAMPLE_EVENT_PATH}?utm_source=share&utm_medium=social`;
  if (isMobile) {
    await expect.poll(() => page.evaluate(() => (window as Window & { __sharedEventUrl?: string }).__sharedEventUrl)).toBe(expectedUrl);
    await expect(shareButton).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
      event.name === "share" && event.params.method === "native_share_sheet" && event.params.item_id === SAMPLE_EVENT_SLUG
    ))).toBe(true);
    return;
  }

  await expect.poll(() => page.evaluate(() => (window as Window & { __copiedEventUrl?: string }).__copiedEventUrl)).toBe(expectedUrl);
  await expect(shareButton).toBeVisible();
  const feedback = page.getByRole("status");
  await expect(feedback).toHaveText("링크를 복사했어요.");
  await expect(feedback).toBeHidden({ timeout: 5_000 });
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
    event.name === "share" && event.params.method === "link_copy" && event.params.item_id === SAMPLE_EVENT_SLUG
  ))).toBe(true);
});

test("GA 이벤트는 탐색부터 상세 도달까지 구조화된 파라미터로 수집한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(0);
  expect(await page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: Array<ArrayLike<unknown>> }).dataLayer ?? [];
    return dataLayer.some((entry) => Array.from(entry)[0] === "config");
  })).toBe(false);

  // 검색은 헤더의 통합 검색(/search)으로 옮겼다(2026-11-21). 검색어 원문은 보내지 않는다.
  await searchFromHeader(page, "바다빛");
  await expect.poll(() => analyticsEventParams(page, "site_search_viewed")).toEqual([
    { query_length: 3, event_count: 1, place_count: 0 },
  ]);

  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  await expect(page).toHaveURL(new RegExp(`${SAMPLE_EVENT_PATH}$`));
  // 통합 검색 결과에서 고른 행사는 site_search로 센다. 그 전에는 목록과 같은 event_list로 섞였다(2026-11-21 GA 보강).
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
    event.name === "select_content"
      && event.params.content_id === SAMPLE_EVENT_SLUG
      && event.params.content_source === "site_search"
  ))).toBe(true);
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
    event.name === "event_detail_viewed"
      && event.params.event_slug === SAMPLE_EVENT_SLUG
      && event.params.event_category === "festival"
  ))).toBe(true);
});

test("GA 이벤트는 목록의 진행중·마감 탭 전환과 검색 결과 수를 기록한다", async ({ page }) => {
  await page.goto("/");
  const statusTabs = page.getByRole("navigation", { name: "행사 상태" });
  const activeTab = statusTabs.getByRole("link", { name: "진행중", exact: true });
  const closedTab = statusTabs.getByRole("link", { name: "마감", exact: true });

  // 이미 선택된 탭을 다시 누른 것은 세지 않는다(정렬과 같은 방식).
  await activeTab.click();
  await closedTab.click();
  await expect(closedTab).toHaveAttribute("aria-current", "page");
  await activeTab.click();
  await expect(activeTab).toHaveAttribute("aria-current", "page");
  await expect.poll(() => analyticsEventParams(page, "status_tab_changed")).toEqual([
    { status_tab: "closed" },
    { status_tab: "active" },
  ]);

  // 홈의 검색창은 헤더 통합 검색으로 옮겼지만, 예전 주소의 ?q=는 계속 목록을 거르고 결과 수를 남긴다(2026-11-21).
  await page.goto("/?q=%EB%B0%94%EB%8B%A4%EB%B9%9B");
  await expect.poll(() => analyticsEventParams(page, "search_results_viewed")).toEqual([
    { result_count: 1, query_length: 3, status_tab: "active" },
  ]);
  // 검색어 원문은 보내지 않는다.
  expect(JSON.stringify(await analyticsEventParams(page, "search_results_viewed"))).not.toContain("바다빛");
});

// 같은 상세 아래쪽에 있는 관련 행사 목록의 노출을 센다(2026-11-07). 주변 명소 구역은 2026-11-21에 뺐다.
test("GA 이벤트는 관련 행사 목록이 화면에 들어왔을 때 상세 화면마다 한 번만 노출로 기록한다", async ({ page }) => {
  await page.goto(SAMPLE_EVENT_PATH);
  await expect.poll(() => analyticsEventParams(page, "event_detail_viewed")).toHaveLength(1);
  const related = page.getByRole("region", { name: "이 행사도 살펴보세요" });

  await expect(related).not.toBeInViewport();
  expect(await analyticsEventParams(page, "related_events_viewed")).toEqual([]);

  await related.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect.poll(() => analyticsEventParams(page, "related_events_viewed")).toEqual([
    { event_category: "festival" },
  ]);
});

test("GA page_view는 주소에 담긴 검색어를 가려서 보낸다", async ({ page }) => {
  const query = "바다빛";
  await page.goto(`/?q=${encodeURIComponent(query)}`);
  await expect.poll(() => analyticsEventParams(page, "page_view")).toHaveLength(1);

  // 검색 결과 → 상세 → 뒤로 가기에서 검색어가 page_location·page_referrer로 실려 갈 수 있다.
  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  await expect(page).toHaveURL(new RegExp(`${SAMPLE_EVENT_PATH}$`));
  // 주소는 화면을 그리는 순간 바뀌고 page_view는 그린 뒤(useEffect)에 남는다. 부하가 크면 그 사이에 뒤로 가서
  // 상세·되돌아온 목록의 page_view가 모두 빠졌다. 사람처럼 상세가 기록된 뒤에 뒤로 간다(2026-11-15).
  await expect.poll(() => analyticsEventParams(page, "page_view")).toHaveLength(2);
  await page.goBack();
  await expect(page).toHaveURL(/q=/);
  await expect.poll(() => analyticsEventParams(page, "page_view")).toHaveLength(3);

  // 샘플 행사 제목에도 같은 단어가 있어 page_title은 빼고 주소만 본다.
  const urls = (await analyticsEventParams(page, "page_view"))
    .flatMap((params) => [params.page_location, params.page_referrer])
    .filter((value) => typeof value === "string")
    .join(" ");
  expect(urls).not.toContain(query);
  expect(urls).not.toContain(encodeURIComponent(query));
  expect(urls).toContain("q=%28redacted%29");
});

test("목록과 상세는 데스크톱·모바일에서 가로로 넘치지 않는다", async ({ page }) => {
  await page.goto("/");
  const listHeading = page.getByRole("heading", { level: 1, name: "요즘 속초에서 뭐하지?", exact: true });
  await expect(listHeading).toBeVisible();

  await expectNoHorizontalOverflow(page, [
    page.getByRole("banner"),
    page.getByRole("main").filter({ has: listHeading }),
    page.getByRole("navigation", { name: "행사 분야" }),
    page.getByRole("article").first(),
  ]);

  await page.goto(SAMPLE_EVENT_PATH);
  const detailHeading = page.getByRole("heading", { level: 1, name: /바다빛 가족 문화축제/ });
  const locationSection = page.getByRole("region", { name: "핵심 정보" });
  await expectNoHorizontalOverflow(page, [
    page.getByRole("main").filter({ has: detailHeading }),
    page.locator("article").first(),
    locationSection,
  ]);
});

// 2026-11-06 사용자 결정: 참여 대상(가족·성인·누구나)은 필터에도 없고 판단에 도움이 적어 카드에서 빼고 상세에만 둔다.
// 분야는 "전체" 탭에서만 포스터 위에 라벨 없이 보여 준다.
test("행사 카드는 전체 목록에서 포스터 위에 분야를 라벨 없이 보여 준다", async ({ page }) => {
  await page.goto("/");
  const familyCard = page.getByRole("region", { name: "행사 목록" }).getByRole("article").filter({ hasText: "[샘플] 바다빛 가족 문화축제" });
  await expect(familyCard.getByLabel("행사 분야")).toHaveText("축제");

  await page.goto("/topics/festival");
  const topicCard = page.getByRole("region", { name: "행사 목록" }).getByRole("article").filter({ hasText: "[샘플] 바다빛 가족 문화축제" });
  await expect(topicCard.getByLabel("행사 분야")).toHaveCount(0);
});

test("헤더에서 검색하고 상세·원문·외부 지도 링크를 확인한다", async ({ context, page }) => {
  await context.route("https://www.sokcho.go.kr/**", (route) => route.abort());

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "요즘 속초에서 뭐하지?", exact: true })).toBeVisible();
  // 2026-11-06 사용자 결정으로 화면의 행사 개수 표시를 뺐다. 목록 구역 안의 카드 수로 확인한다.
  const results = page.getByRole("region", { name: "행사 목록" });
  await expect(results.getByRole("article")).toHaveCount(7);
  await searchFromHeader(page, "바다빛");
  await expect(page.getByRole("region", { name: "행사" }).getByRole("article")).toHaveCount(1);

  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  await expect(page).toHaveURL(new RegExp(`${SAMPLE_EVENT_PATH}$`));
  await expect(page.getByRole("heading", { level: 1, name: /바다빛 가족 문화축제/ })).toBeVisible();
  // 맨 위 "‹ 목록으로 돌아가기"와 맨 아래 버튼 둘 다 행사 목록으로 간다(2026-11-21 사용자 결정으로 맨 위에도 둠).
  const backToListLinks = page.getByRole("link", { name: "목록으로 돌아가기" });
  await expect(backToListLinks).toHaveCount(2);
  for (const link of await backToListLinks.all()) await expect(link).toHaveAttribute("href", "/");

  const sourceLink = page.getByRole("link", { name: /행사 안내/ });
  await expect(sourceLink).toHaveAttribute("href", "https://www.sokcho.go.kr/");
  await expect(sourceLink).toHaveAccessibleName("행사 안내 (새 창)");
  await expect(page.getByText("관련 링크", { exact: true })).toHaveCount(0);
  const popupPromise = page.waitForEvent("popup");
  await sourceLink.click();
  const popup = await popupPromise;
  await popup.close();

  await expect(page.getByRole("link", { name: /네이버 지도/ })).toBeVisible();
  // 행사 상세에는 행사에 필요한 정보만 둔다. 주변 명소 구역은 뺐다(2026-11-21 사용자 결정).
  await expect(page.getByRole("region", { name: /주변 명소/ })).toHaveCount(0);
});

test("진행중과 마감 탭으로 참여 가능한 행사와 지난 기록을 분리한다", async ({ page }) => {
  await page.goto("/");
  const statusTabs = page.getByRole("navigation", { name: "행사 상태" });
  const activeTab = statusTabs.getByRole("link", { name: "진행중", exact: true });
  const closedTab = statusTabs.getByRole("link", { name: "마감", exact: true });

  await expect(activeTab).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("region", { name: "행사 목록" }).getByRole("article")).toHaveCount(7);
  await expect(page.getByRole("link", { name: /지난 계절 문화 프로그램/ })).toHaveCount(0);

  await closedTab.click();

  await expect(page).toHaveURL(/status=closed/);
  await expect(closedTab).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("region", { name: "마감 행사" }).getByRole("article")).toHaveCount(1);
  const endedEvent = page.getByRole("link", { name: /지난 계절 문화 프로그램/ });
  await expect(endedEvent).toBeVisible();
  await expect(endedEvent.getByText("종료된 행사예요", { exact: true })).toBeVisible();
  await expect(endedEvent.getByText("신청이 마감된 행사예요", { exact: true })).toHaveCount(0);
  // 마감 탭에서도 위쪽 배너(많이 보는 행사)는 보이므로, 진행 중 행사가 빠졌는지는 마감 행사 목록 안에서 확인한다(2026-11-06).
  await expect(page.getByRole("region", { name: "마감 행사" }).getByRole("link", { name: /바다빛 가족 문화축제/ })).toHaveCount(0);
});

// 2026-11-06 사용자 결정: 기본 정렬을 게시순에서 행사일순으로 바꿨다.
// 새로 올라온 행사는 카드의 NEW 표시로 알리므로 "새로 올라온 순"·"마감일순" 정렬과 바로가기 칩은 모두 뺐다.
// 마감일순 정렬 자체는 unit test(filters.test.ts)가 지키고, 예전 주소(sort=deadline)도 계속 동작한다.
test("행사 목록은 행사일순이 기본이고 조회순으로 바꿀 수 있다", async ({ page }) => {
  await page.goto("/");
  const results = page.getByRole("region", { name: "행사 목록" });
  const sort = page.getByRole("navigation", { name: "행사 정렬" });
  await expect(sort.getByRole("link")).toHaveText(["행사일순", "조회순"]);
  await expect(sort.getByRole("link", { name: "행사일순" })).toHaveAttribute("aria-current", "page");
  await expect(results.getByRole("article").first()).toContainText("아바이마을 이야기 산책");

  await sort.getByRole("link", { name: "조회순" }).click();
  await expect(page).toHaveURL(/sort=views/);
  await expect(sort.getByRole("link", { name: "조회순" })).toHaveAttribute("aria-current", "page");

  await sort.getByRole("link", { name: "행사일순" }).click();
  await expect(page).not.toHaveURL(/sort=/);
  await expect(sort.getByRole("link", { name: "행사일순" })).toHaveAttribute("aria-current", "page");
});

test("캐시된 상세 페이지도 신청 상태는 방문자의 현재 시각으로 보여 준다", async ({ page }) => {
  // seed의 demo-children-craft는 신청 마감이 DB 초기화 시점 + 2일이다. 브라우저 시각을 그 뒤로 옮긴다.
  await page.clock.install({ time: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1_000) });
  await page.goto("/events/demo-children-craft");

  const facts = page.getByRole("region", { name: "핵심 정보" });
  await expect(facts.getByText("신청 마감", { exact: true })).toBeVisible();
  await expect(page.getByLabel("행사 상태").first().getByText("신청이 마감된 행사예요", { exact: true })).toBeVisible();
});

// 모바일 상세 포스터는 높이 240px 안에 줄어 있어 포스터 속 글자를 읽기 어렵다. 눌러서 화면 가득 크게 본다(2026-11-18 사용자 결정).
test("행사 상세 포스터를 누르면 크게 보고, 닫기·Esc·뒤로가기로 닫으면 상세 페이지에 머문다", async ({ page }) => {
  await page.goto("/");
  await page.goto(SAMPLE_EVENT_PATH);
  const openButton = page.getByRole("button", { name: "포스터 크게 보기" });
  const viewer = page.getByRole("dialog", { name: /포스터$/ });

  await openButton.click();
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole("img")).toBeVisible();
  // 크게 보기를 실제로 쓰는지 세어 여러 장 갤러리를 할지 판단한다(2026-11-18 사용자 결정).
  await expect.poll(() => analyticsEventParams(page, "poster_viewed")).toEqual([{ event_slug: SAMPLE_EVENT_SLUG, event_category: "festival" }]);
  const closeButton = viewer.getByRole("button", { name: "닫기" });
  await expect(closeButton).toBeInViewport();
  // 열린 채 스크롤해도 뒤 페이지가 움직이지 않아, 닫으면 보던 자리 그대로다.
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 800);
  // 스크롤이 일어났다면 반영될 시간을 준 뒤 비교한다(바로 비교하면 스크롤 전 값과 같아 통과해 버림).
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  await closeButton.click();
  await expect(viewer).toBeHidden();
  await expect(openButton).toBeFocused();

  await openButton.click();
  await expect(viewer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();

  // 안드로이드 뒤로가기로 닫아도 상세 페이지를 떠나지 않는다.
  await openButton.click();
  await expect(viewer).toBeVisible();
  await page.goBack();
  await expect(viewer).toBeHidden();
  await expect(page).toHaveURL(new RegExp(`${SAMPLE_EVENT_PATH}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // 여러 번 열고 닫아도 크게 보기 기록이 남지 않아, 뒤로가기 한 번이면 들어오기 전 페이지로 간다.
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("포스터가 없는 행사는 크게 보기 버튼을 두지 않는다", async ({ page }) => {
  await page.goto("/events/demo-children-craft");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "포스터 크게 보기" })).toHaveCount(0);
});
