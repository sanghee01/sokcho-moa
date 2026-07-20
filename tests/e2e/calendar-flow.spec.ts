import { expect, test } from "@playwright/test";

const day = 24 * 60 * 60 * 1_000;

function koreanDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function koreanMonthKey(date: Date) {
  const parts = koreanDateParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

function koreanDateLabel(date: Date) {
  const parts = koreanDateParts(date);
  return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
}

test("헤더에서 행사 캘린더로 이동해 연속 일정과 신청 상태를 확인한다", async ({ page }, testInfo) => {
  await page.goto("/");
  const calendarLink = page.getByRole("link", { name: "행사 캘린더", exact: true });
  await expect(calendarLink).toBeVisible();
  await calendarLink.click();

  await expect(page).toHaveURL(/\/calendar(?:\?|$)/);
  await expect(page.getByRole("heading", { level: 1, name: "행사 캘린더" })).toBeVisible();
  await expect(page.getByLabel("신청 상태 범례").getByText("신청 가능", { exact: true })).toBeVisible();
  await expect(page.getByLabel("신청 상태 범례").getByText("신청 마감", { exact: true })).toBeVisible();

  if (testInfo.project.name === "desktop-chromium") {
    const desktopCalendar = page.locator("[data-calendar-desktop]");
    await expect(desktopCalendar).toBeVisible();
    const segments = desktopCalendar.locator('[data-event-slug="demo-mountain-exhibition"]');
    expect(await segments.count()).toBeGreaterThan(1);
    const totalSpan = await segments.evaluateAll((elements) => elements.reduce((sum, element) => (
      sum + Number(element.getAttribute("data-calendar-span") ?? 0)
    ), 0));
    expect(totalSpan).toBeGreaterThan(7);
    await expect(segments.first()).toHaveAccessibleName(/산과 사람 기획전.*별도 신청 없음/);
  } else {
    const mobileCalendar = page.locator("[data-calendar-mobile]");
    await expect(mobileCalendar).toBeVisible();
    await expect(mobileCalendar.getByRole("heading", { name: koreanDateLabel(new Date()) })).toBeVisible();
    await expect(mobileCalendar.getByRole("link", { name: /산과 사람 기획전/ })).toBeVisible();
  }

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);

  const mountainExhibitionLink = testInfo.project.name === "desktop-chromium"
    ? page.locator('[data-calendar-desktop] [data-event-slug="demo-mountain-exhibition"]').first()
    : page.locator("[data-calendar-mobile]").getByRole("link", { name: /산과 사람 기획전/ });
  await mountainExhibitionLink.click();

  await expect(page).toHaveURL(/\/events\/demo-mountain-exhibition$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "[샘플] 산과 사람 기획전", exact: true }),
  ).toBeVisible();
});

test("월 이동은 URL과 화면 제목을 함께 바꾼다", async ({ page }) => {
  await page.goto("/calendar?month=2026-01");
  await expect(
    page.getByRole("heading", { name: "2026년 1월", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "다음 달", exact: true }).click();
  await expect(page).toHaveURL(/month=2026-02/);
  await expect(
    page.getByRole("heading", { name: "2026년 2월", exact: true }),
  ).toBeVisible();
});

test("모바일에서 날짜를 바꾸면 그날의 이어지는 행사 agenda가 갱신된다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "모바일 날짜 선택 전용 검증");
  await page.goto("/calendar");

  const tomorrow = new Date(Date.now() + day);
  const tomorrowLabel = koreanDateLabel(tomorrow);
  const tomorrowButton = page.getByRole("button", { name: new RegExp(`^${tomorrowLabel},`) });
  await expect(tomorrowButton).toBeVisible();
  await tomorrowButton.click();

  await expect(page.getByRole("heading", { name: tomorrowLabel })).toBeVisible();
  await expect(page.locator("[data-calendar-mobile]").getByRole("link", { name: /산과 사람 기획전/ })).toBeVisible();
});

test("신청이 끝난 행사에는 신청 마감이 행사 항목 자체에 표시된다", async ({ page }, testInfo) => {
  const endedDate = new Date(Date.now() - 25 * day);
  await page.goto(`/calendar?month=${koreanMonthKey(endedDate)}`);

  if (testInfo.project.name === "mobile-chromium") {
    const endedDateButton = page.getByRole("button", { name: new RegExp(`^${koreanDateLabel(endedDate)},`) });
    await expect(endedDateButton).toBeVisible();
    await endedDateButton.click();
  }

  const closedEvent = page.getByRole("link", { name: /지난 계절 문화 프로그램.*신청 마감/ });
  await expect(closedEvent.first()).toBeVisible();
});
