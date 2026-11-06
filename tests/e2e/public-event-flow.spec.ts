import { expect, test, type Locator, type Page } from "@playwright/test";

interface ElementBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CapturedAnalyticsEvent {
  name: string;
  params: Record<string, string | number | boolean>;
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

async function capturedAnalyticsEvents(page: Page): Promise<CapturedAnalyticsEvent[]> {
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

test("없는 페이지와 없는 행사를 각각 이해하기 쉬운 화면으로 안내한다", async ({ page }) => {
  await page.goto("/존재하지-않는-페이지");
  await expect(page.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없어요." })).toBeVisible();
  await expect(page.getByRole("link", { name: "행사 목록으로" })).toHaveAttribute("href", "/");

  await page.goto("/events/존재하지-않는-행사");
  await expect(page.getByRole("heading", { level: 1, name: "공개된 행사를 찾을 수 없어요." })).toBeVisible();
  await expect(page.getByText(/비공개로 전환됐거나 주소가 바뀌었을 수 있습니다/)).toBeVisible();
});

test("행사 상세는 지도 SDK나 인라인 미리보기 없이 장소·주소·외부 링크를 제공한다", async ({ page }) => {
  const mapSdkRequests: string[] = [];
  page.on("request", (request) => {
    const hostname = new URL(request.url()).hostname;
    if (hostname === "oapi.map.naver.com" || hostname === "dapi.kakao.com") {
      mapSdkRequests.push(request.url());
    }
  });

  await page.goto("/events/demo-sea-family-festival");

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

  await page.goto("/events/demo-sea-family-festival?from=search#facts-title");
  const shareButton = page.getByRole("button", { name: "공유하기" });
  await expect(shareButton).toBeVisible();
  await shareButton.click();

  const expectedUrl = "http://127.0.0.1:3100/events/demo-sea-family-festival";
  if (isMobile) {
    await expect.poll(() => page.evaluate(() => (window as Window & { __sharedEventUrl?: string }).__sharedEventUrl)).toBe(expectedUrl);
    await expect(shareButton).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
      event.name === "share" && event.params.method === "native_share_sheet" && event.params.item_id === "demo-sea-family-festival"
    ))).toBe(true);
    return;
  }

  await expect.poll(() => page.evaluate(() => (window as Window & { __copiedEventUrl?: string }).__copiedEventUrl)).toBe(expectedUrl);
  await expect(shareButton).toBeVisible();
  const feedback = page.getByRole("status");
  await expect(feedback).toHaveText("링크를 복사했어요.");
  await expect(feedback).toBeHidden({ timeout: 5_000 });
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
    event.name === "share" && event.params.method === "link_copy" && event.params.item_id === "demo-sea-family-festival"
  ))).toBe(true);
});

test("GA 이벤트는 탐색부터 상세 도달까지 구조화된 파라미터로 수집한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(0);
  expect(await page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: Array<ArrayLike<unknown>> }).dataLayer ?? [];
    return dataLayer.some((entry) => Array.from(entry)[0] === "config");
  })).toBe(false);

  await page.getByLabel("행사명, 장소, 기관 검색").fill("바다빛");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page).toHaveURL(/q=/);
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).find((event) => event.name === "search_submitted")?.params).toMatchObject({
    query_length: 3,
    has_query: true,
    active_filter_count: 0,
  });
  const searchEvent = (await capturedAnalyticsEvents(page)).find((event) => event.name === "search_submitted");
  expect(searchEvent?.params).not.toHaveProperty("search_term");

  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  await expect(page).toHaveURL(/\/events\/demo-sea-family-festival$/);
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
    event.name === "select_content"
      && event.params.content_id === "demo-sea-family-festival"
      && event.params.content_source === "event_list"
  ))).toBe(true);
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
    event.name === "event_detail_viewed"
      && event.params.event_slug === "demo-sea-family-festival"
      && event.params.event_category === "festival"
  ))).toBe(true);
});

test("목록과 상세는 데스크톱·모바일에서 가로로 넘치지 않는다", async ({ page }) => {
  await page.goto("/");
  const listHeading = page.getByRole("heading", { level: 1, name: "요즘 속초에서 뭐하지?", exact: true });
  await expect(listHeading).toBeVisible();

  await expectNoHorizontalOverflow(page, [
    page.getByRole("banner"),
    page.getByRole("main").filter({ has: listHeading }),
    page.getByRole("search", { name: "행사 검색" }),
    page.getByRole("article").first(),
  ]);

  await page.goto("/events/demo-sea-family-festival");
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

test("목록에서 검색하고 상세·원문·외부 지도 링크·주변 명소를 확인한다", async ({ context, page }) => {
  await context.route("https://www.sokcho.go.kr/**", (route) => route.abort());

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "요즘 속초에서 뭐하지?", exact: true })).toBeVisible();
  // 2026-11-06 사용자 결정으로 화면의 행사 개수 표시를 뺐다. 목록 구역 안의 카드 수로 확인한다.
  const results = page.getByRole("region", { name: "행사 목록" });
  await expect(results.getByRole("article")).toHaveCount(7);
  await page.getByLabel("행사명, 장소, 기관 검색").fill("바다빛");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page).toHaveURL(/q=/);
  await expect(results.getByRole("article")).toHaveCount(1);

  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  await expect(page).toHaveURL(/\/events\/demo-sea-family-festival$/);
  await expect(page.getByRole("heading", { level: 1, name: /바다빛 가족 문화축제/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "목록으로 돌아가기" })).toHaveAttribute("href", "/");

  const sourceLink = page.getByRole("link", { name: /행사 안내/ });
  await expect(sourceLink).toHaveAttribute("href", "https://www.sokcho.go.kr/");
  await expect(sourceLink).toHaveAccessibleName("행사 안내 (새 창)");
  await expect(page.getByText("관련 링크", { exact: true })).toHaveCount(0);
  const popupPromise = page.waitForEvent("popup");
  await sourceLink.click();
  const popup = await popupPromise;
  await popup.close();

  await expect(page.getByRole("link", { name: /네이버 지도/ })).toBeVisible();
  const nearby = page.getByRole("region", { name: "주변 명소 둘러보기" });
  await expect(nearby.getByRole("article")).toHaveCount(4);
  await expect(nearby.getByRole("link", { name: /지도에서 보기/ }).first()).toBeVisible();
});

test("검색 응답이 늦어도 제출 즉시 진행 상태를 알린다", async ({ page }) => {
  let releaseRequest: () => void = () => {};
  const delayedResponse = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await page.route("**/*q=%EB%B0%94%EB%8B%A4%EB%B9%9B*", async (route) => {
    if (route.request().headers().rsc) await delayedResponse;
    await route.continue();
  });

  await page.goto("/");
  const search = page.getByRole("search", { name: "행사 검색" });
  await search.getByRole("searchbox").fill("바다빛");
  const submitPromise = search.getByRole("button", { name: "검색", exact: true }).click();

  await expect(search).toHaveAttribute("aria-busy", "true");
  await expect(search.getByRole("button")).toBeDisabled();

  releaseRequest();
  await submitPromise;
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByRole("region", { name: "행사 목록" }).getByRole("article")).toHaveCount(1);
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

test("뒤로 가서 검색 전 목록으로 돌아오면 검색창도 비워진다", async ({ page }) => {
  await page.goto("/");
  const searchbox = page.getByRole("search", { name: "행사 검색" }).getByRole("searchbox");
  await searchbox.fill("바다빛");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page).toHaveURL(/q=/);

  await page.goBack();
  await expect(page).not.toHaveURL(/q=/);
  await expect(searchbox).toHaveValue("");
});

test("캐시된 상세 페이지도 신청 상태는 방문자의 현재 시각으로 보여 준다", async ({ page }) => {
  // seed의 demo-children-craft는 신청 마감이 DB 초기화 시점 + 2일이다. 브라우저 시각을 그 뒤로 옮긴다.
  await page.clock.install({ time: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1_000) });
  await page.goto("/events/demo-children-craft");

  const facts = page.getByRole("region", { name: "핵심 정보" });
  await expect(facts.getByText("신청 마감", { exact: true })).toBeVisible();
  await expect(page.getByLabel("행사 상태").first().getByText("신청이 마감된 행사예요", { exact: true })).toBeVisible();
});
