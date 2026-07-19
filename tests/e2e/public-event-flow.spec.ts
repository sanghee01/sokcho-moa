import { expect, test } from "@playwright/test";

test("null·빈 문자열·404 이미지가 고정된 무문자 대체 영역으로 전환된다", async ({ page }) => {
  await page.goto("/");

  for (const title of ["바다빛 가족 문화축제", "어린이 바다 공예 체험", "청소년 미디어 창작 교실"]) {
    const card = page.getByRole("article").filter({ hasText: title });
    const imageFallback = card.getByRole("img", { name: /대표 이미지/ });
    await expect(imageFallback).toBeVisible();
    await expect(imageFallback).toBeEmpty();

    const fallbackBox = await imageFallback.boundingBox();
    expect(fallbackBox).not.toBeNull();
    expect(fallbackBox!.width / fallbackBox!.height).toBeCloseTo(16 / 9, 1);
  }
});

test("목록에서 필터하고 상세·원문·주변 명소를 확인한다", async ({ context, page }) => {
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

  const mapFallback = page.getByRole("status").filter({ hasText: "지도를 불러오지 못했습니다." });
  await expect(mapFallback).toBeVisible();
  const mapFallbackBox = await mapFallback.boundingBox();
  expect(mapFallbackBox).not.toBeNull();
  expect(mapFallbackBox!.height).toBe(288);

  const sourceLink = page.getByRole("link", { name: /공식 원문/ }).first();
  await expect(sourceLink).toHaveAttribute("href", "https://www.sokcho.go.kr/");
  await expect(sourceLink).toHaveAttribute("target", "_blank");
  await expect(sourceLink).toHaveAccessibleName("공식 원문 (새 창)");
  const popupPromise = page.waitForEvent("popup");
  await sourceLink.click();
  const popup = await popupPromise;
  await popup.close();

  await expect(page.getByRole("link", { name: /네이버 지도/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /카카오맵 길찾기/ })).toBeVisible();

  const nearby = page.getByRole("region", { name: "주변 명소 둘러보기" });
  await expect(nearby).toBeVisible();
  await expect(nearby.getByRole("article")).toHaveCount(4);
  await expect(nearby.getByRole("link", { name: /지도에서 보기/ }).first()).toBeVisible();
});
