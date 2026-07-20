import { expect, test, type Locator, type Page } from "@playwright/test";

type ElementBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CapturedAnalyticsEvent = {
  name: string;
  params: Record<string, string | number | boolean>;
};

async function visibleBox(locator: Locator): Promise<ElementBox> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

function expectSameDimensions(actual: ElementBox, expected: ElementBox) {
  expect(Math.abs(actual.width - expected.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.height - expected.height)).toBeLessThanOrEqual(1);
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

test("행사 상세는 지도 SDK나 인라인 미리보기 없이 장소·주소·외부 링크를 제공한다", async ({ page }) => {
  const mapSdkRequests: string[] = [];
  page.on("request", (request) => {
    const hostname = new URL(request.url()).hostname;
    if (hostname === "oapi.map.naver.com" || hostname === "dapi.kakao.com") {
      mapSdkRequests.push(request.url());
    }
  });

  await page.goto("/events/demo-sea-family-festival");

  const locationCard = page.getByRole("region", { name: "속초해수욕장 인근(샘플)" });
  await expect(locationCard.getByText("강원특별자치도 속초시 해오름로 190", { exact: true })).toBeVisible();
  const locationCardBox = await visibleBox(locationCard);
  expect(locationCardBox.height).toBeLessThan(288);
  await expect(page.getByRole("img", { name: /위치 지도/ })).toHaveCount(0);
  await expect(page.getByText("지도를 불러오는 중입니다.")).toHaveCount(0);
  await expect(page.getByText("지도를 불러오지 못했습니다.")).toHaveCount(0);

  const mapLink = page.getByRole("link", { name: /네이버 지도에서 위치 확인/ });
  await expect(mapLink).toBeVisible();
  await expect(mapLink).toHaveAttribute("href", /^https:\/\/map\.naver\.com\/p\/search\//);
  await expect(mapLink).toHaveAttribute("target", "_blank");
  await expect(mapLink).toHaveAttribute("rel", "noreferrer");
  await expect(mapLink).toHaveAttribute("data-analytics-event", "map_link_clicked");
  await expect(mapLink).toHaveAccessibleName("네이버 지도에서 위치 확인 (새 창)");

  await page.waitForLoadState("networkidle");
  await page.evaluate(() => new Promise<void>((resolve) => {
    const settle = () => window.setTimeout(resolve, 100);
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(settle, { timeout: 500 });
    } else {
      settle();
    }
  }));

  await expect(locationCard.locator("iframe")).toHaveCount(0);
  await expect(page.locator('script[src*="oapi.map.naver.com"], script[src*="dapi.kakao.com"]')).toHaveCount(0);
  expect(mapSdkRequests).toEqual([]);
});

test("공유하기는 데스크톱에서 행사 링크만 복사하고 모바일에서는 네이티브 공유 창을 연다", async ({ page }, testInfo) => {
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
  await page.getByRole("button", { name: "공유하기" }).click();

  const expectedUrl = "http://127.0.0.1:3100/events/demo-sea-family-festival";
  if (isMobile) {
    await expect.poll(() => page.evaluate(() => (window as Window & { __sharedEventUrl?: string }).__sharedEventUrl)).toBe(expectedUrl);
    await expect(page.getByRole("button", { name: "공유 완료" })).toBeVisible();
    await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
      event.name === "share" && event.params.method === "native_share" && event.params.item_id === "demo-sea-family-festival"
    ))).toBe(true);
    return;
  }

  await expect.poll(() => page.evaluate(() => (window as Window & { __copiedEventUrl?: string }).__copiedEventUrl)).toBe(expectedUrl);
  await expect(page.getByRole("button", { name: "링크 복사됨" })).toBeVisible();
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
    event.name === "share" && event.params.method === "link_copy" && event.params.item_id === "demo-sea-family-festival"
  ))).toBe(true);
});

test("GA 이벤트는 탐색부터 상세 도달까지 구조화된 파라미터로 수집한다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "가족", exact: true }).click();
  await expect(page).toHaveURL(/audience=family/);
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).some((event) => (
    event.name === "filter_used"
      && event.params.filter_type === "audience"
      && event.params.filter_value === "family"
      && event.params.filter_action === "apply"
  ))).toBe(true);

  await page.getByLabel("키워드 검색").fill("바다빛");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page).toHaveURL(/q=/);
  await expect.poll(async () => (await capturedAnalyticsEvents(page)).find((event) => event.name === "search_submitted")?.params).toMatchObject({
    query_length: 3,
    has_query: true,
    active_filter_count: 1,
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

test("정상·null·빈 문자열·404 이미지가 목록과 상세에서 같은 크기를 유지한다", async ({ page }) => {
  let imageResponse: "normal" | "missing" = "normal";
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );

  await page.route("**/missing-event-image.jpg", async (route) => {
    if (imageResponse === "normal") {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: pixel,
        headers: { "cache-control": "no-store" },
      });
      return;
    }
    await route.fulfill({ status: 404, body: "", headers: { "cache-control": "no-store" } });
  });

  await page.goto("/");
  const youthCard = page.getByRole("article").filter({ hasText: "청소년 미디어 창작 교실" });
  const normalListImage = youthCard.getByRole("img", { name: "[샘플] 청소년 미디어 창작 교실" });
  await expect.poll(() => normalListImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
  await expect(normalListImage).toHaveCSS("object-fit", "cover");
  const normalListBox = await visibleBox(normalListImage);
  expect(normalListBox.width / normalListBox.height).toBeCloseTo(16 / 9, 1);

  await page.goto("/events/demo-youth-media-class");
  const normalDetailImage = page.getByRole("img", { name: "[샘플] 청소년 미디어 창작 교실" });
  await expect.poll(() => normalDetailImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
  await expect(normalDetailImage).toHaveCSS("object-fit", "contain");
  const normalDetailBox = await visibleBox(normalDetailImage);

  imageResponse = "missing";
  await page.goto("/");

  const fallbackTitles = [
    "[샘플] 바다빛 가족 문화축제",
    "[샘플] 어린이 바다 공예 체험",
    "[샘플] 청소년 미디어 창작 교실",
  ];
  for (const title of fallbackTitles) {
    const card = page.getByRole("article").filter({ hasText: title });
    const imageFallback = card.getByRole("img", { name: `${title} 대표 이미지` });
    await expect(imageFallback).toBeEmpty();
    const fallbackBox = await visibleBox(imageFallback);
    expectSameDimensions(fallbackBox, normalListBox);
    expect(fallbackBox.width / fallbackBox.height).toBeCloseTo(16 / 9, 1);
  }
  await expect(page.getByText("공식 이미지 준비 중")).toHaveCount(0);

  const detailFixtures = [
    ["demo-sea-family-festival", fallbackTitles[0]],
    ["demo-children-craft", fallbackTitles[1]],
    ["demo-youth-media-class", fallbackTitles[2]],
  ] as const;

  for (const [slug, title] of detailFixtures) {
    await page.goto(`/events/${slug}`);
    const imageFallback = page.getByRole("img", { name: `${title} 대표 이미지` }).first();
    await expect(imageFallback).toBeEmpty();
    expectSameDimensions(await visibleBox(imageFallback), normalDetailBox);
    await expect(page.getByText("공식 이미지 준비 중")).toHaveCount(0);
  }
});

test("목록과 상세는 데스크톱·모바일에서 가로로 넘치지 않는다", async ({ page }) => {
  await page.goto("/");
  const listHeading = page.getByRole("heading", { name: "요즘 속초에서 뭐하지?" });
  await expect(listHeading).toBeVisible();

  await expectNoHorizontalOverflow(page, [
    page.getByRole("main").filter({ has: listHeading }),
    page.getByRole("region", { name: "어떤 하루를 찾으세요?" }),
    page.getByRole("article").first(),
  ]);

  await page.goto("/events/demo-sea-family-festival");
  const detailHeading = page.getByRole("heading", { level: 1, name: /바다빛 가족 문화축제/ });
  const locationSection = page.getByRole("heading", { name: "속초해수욕장 인근(샘플)" }).locator("..");
  await expectNoHorizontalOverflow(page, [
    page.getByRole("main").filter({ has: detailHeading }),
    page.locator("article").first(),
    locationSection,
  ]);
});

test("행사 카드에서 주제와 참여 대상을 라벨 없이 배지로 표시한다", async ({ page }) => {
  await page.goto("/");
  const familyCard = page.getByRole("article").filter({ hasText: "[샘플] 바다빛 가족 문화축제" });
  const taxonomy = familyCard.getByLabel("행사 주제와 참여 대상");

  await expect(taxonomy).toContainText("축제");
  await expect(taxonomy).toContainText("가족");
  await expect(taxonomy.getByText("주제", { exact: true })).toHaveCount(0);
  await expect(taxonomy.getByText("대상", { exact: true })).toHaveCount(0);

  const categoryBadge = taxonomy.getByText("축제", { exact: true });
  const audienceBadge = taxonomy.getByText("가족", { exact: true });
  await expect(categoryBadge).toHaveCSS("font-size", "14px");
  await expect(audienceBadge).toHaveCSS("font-size", "14px");
  await expect(categoryBadge).toHaveCSS("color", "rgb(255, 255, 255)");
  const categoryColors = await categoryBadge.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  const audienceColors = await audienceBadge.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  expect(audienceColors).not.toEqual(categoryColors);
});

test("일정 거리 스크롤하면 오른쪽 하단 버튼으로 페이지 맨 위에 돌아간다", async ({ page }) => {
  await page.goto("/");
  const scrollToTop = page.getByTestId("scroll-to-top");

  await expect(scrollToTop).toHaveAttribute("aria-hidden", "true");
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(600);
  await expect(scrollToTop).toHaveAttribute("aria-hidden", "false");
  await expect(scrollToTop).toBeVisible();

  await scrollToTop.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2);
  await expect(scrollToTop).toHaveAttribute("aria-hidden", "true");
});

test("목록에서 필터하고 상세·원문·외부 지도 링크·주변 명소를 확인한다", async ({ context, page }) => {
  await context.route("https://www.sokcho.go.kr/**", (route) => route.abort());

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "요즘 속초에서 뭐하지?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /찾은 행사 8개/ })).toBeVisible();
  await page.getByRole("link", { name: "가족", exact: true }).click();
  await expect(page).toHaveURL(/audience=family/);
  await expect(page.getByRole("heading", { name: /찾은 행사 7개/ })).toBeVisible();

  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  await expect(page).toHaveURL(/\/events\/demo-sea-family-festival$/);
  await expect(page.getByRole("heading", { level: 1, name: /바다빛 가족 문화축제/ })).toBeVisible();

  const sourceLink = page.getByRole("link", { name: /공식 원문/ }).first();
  await expect(sourceLink).toHaveAttribute("href", "https://www.sokcho.go.kr/");
  await expect(sourceLink).toHaveAccessibleName("공식 원문 (새 창)");
  const popupPromise = page.waitForEvent("popup");
  await sourceLink.click();
  const popup = await popupPromise;
  await popup.close();

  await expect(page.getByRole("link", { name: /네이버 지도에서 위치 확인/ })).toBeVisible();
  const nearby = page.getByRole("region", { name: "주변 명소 둘러보기" });
  await expect(nearby.getByRole("article")).toHaveCount(4);
  await expect(nearby.getByRole("link", { name: /지도에서 보기/ }).first()).toBeVisible();
});

test("필터 응답이 늦어도 클릭 즉시 진행 상태를 알린다", async ({ page }) => {
  let releaseRequest = () => {};
  const delayedResponse = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await page.route("**/*audience=family*", async (route) => {
    if (route.request().headers().rsc) await delayedResponse;
    await route.continue();
  });

  await page.goto("/");
  const familyFilter = page.getByRole("link", { name: "가족", exact: true });
  await familyFilter.click();

  await expect(familyFilter).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("region", { name: "어떤 하루를 찾으세요?" })).toHaveAttribute("aria-busy", "true");
  await expect(page.getByText("필터를 적용하고 있어요.")).toHaveCount(0);

  releaseRequest();
  await expect(page).toHaveURL(/audience=family/);
  await expect(page.getByRole("heading", { name: /찾은 행사 7개/ })).toBeVisible();
});

test("행사 목록에서 최신·조회·게시 기준으로 정렬할 수 있다", async ({ page }) => {
  await page.goto("/");
  const sort = page.getByRole("navigation", { name: "행사 정렬" });

  await sort.getByRole("link", { name: "조회순" }).click();
  await expect(page).toHaveURL(/sort=views/);
  await expect(sort.getByRole("link", { name: "조회순" })).toHaveAttribute("aria-current", "page");

  await sort.getByRole("link", { name: "게시순" }).click();
  await expect(page).toHaveURL(/sort=published/);
  await expect(sort.getByRole("link", { name: "게시순" })).toHaveAttribute("aria-current", "page");

  await sort.getByRole("link", { name: "최신순" }).click();
  await expect(page).not.toHaveURL(/sort=/);
  await expect(sort.getByRole("link", { name: "최신순" })).toHaveAttribute("aria-current", "page");
});
