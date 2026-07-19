import { expect, test, type Locator, type Page } from "@playwright/test";

type ElementBox = {
  x: number;
  y: number;
  width: number;
  height: number;
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

test("행사 상세는 지도 SDK나 인라인 미리보기 없이 장소·주소·외부 링크를 제공한다", async ({ page }) => {
  let sdkRequestCount = 0;
  await page.route("https://oapi.map.naver.com/**", async (route) => {
    sdkRequestCount += 1;
    await route.abort("blockedbyclient");
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
  expect(sdkRequestCount).toBe(0);
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
  const normalListBox = await visibleBox(normalListImage);
  expect(normalListBox.width / normalListBox.height).toBeCloseTo(16 / 9, 1);

  await page.goto("/events/demo-youth-media-class");
  const normalDetailImage = page.getByRole("img", { name: "[샘플] 청소년 미디어 창작 교실" });
  await expect.poll(() => normalDetailImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
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
  const listHeading = page.getByRole("heading", { name: "요즘 속초에서 뭐 하지?" });
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

test("목록에서 필터하고 상세·원문·외부 지도 링크·주변 명소를 확인한다", async ({ context, page }) => {
  await context.route("https://www.sokcho.go.kr/**", (route) => route.abort());

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "요즘 속초에서 뭐 하지?" })).toBeVisible();
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
