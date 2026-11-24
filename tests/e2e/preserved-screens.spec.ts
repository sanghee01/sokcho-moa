import { expect, test, type Page } from "@playwright/test";
import { analyticsEventParams } from "@/tests/e2e/fixtures";
import { routeFakeNaverMaps } from "@/tests/e2e/naver-maps-stub";

// cacheComponents는 떠난 화면을 지우지 않고 숨겨 두었다가(React <Activity>, 최근 3개) 돌아오면 그대로 다시 보인다(2026-11-24).
// 숨긴 화면도 DOM에 남으므로, 그 화면이 바꾸던 전역 모양·상태가 지금 보이는 화면에 새지 않는지와 다시 들어올 때의 초기화를 지킨다.

function primaryMenuLink(page: Page, name: string) {
  return page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name, exact: true });
}

test.describe("숨겨 둔 화면의 전역 모양", () => {
  // 행사 상세는 하단 탭 대신 행동 바를 보인다. 상세를 떠난 뒤에도 그 규칙이 남아 목록에서 하단 탭이 사라졌다(2026-11-24 리뷰).
  test("행사 상세에서 목록으로 돌아오면 하단 탭이 다시 보인다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "하단 탭은 md 미만에서만 보인다");
    await page.goto("/");
    const bottomNavigation = page.locator("[data-bottom-nav]");
    await expect(bottomNavigation).toBeVisible();

    await page.getByRole("region", { name: "행사 목록" }).getByRole("article").first().getByRole("link").first().click();
    await expect(page).toHaveURL(/\/events\//);
    await expect(bottomNavigation).toBeHidden();
    await page.getByRole("link", { name: "목록으로 돌아가기" }).first().click();

    await expect(page).toHaveURL(/:\d+\/$/);
    await expect(bottomNavigation).toBeVisible();
    await expect(primaryMenuLink(page, "지도")).toBeInViewport();
  });

  // 지도는 화면을 꽉 채우려고 공통 푸터와 공지 띠를 숨긴다. 지도를 떠난 뒤에도 숨긴 채 남았다(2026-11-24 리뷰).
  test("지도에서 다른 화면으로 가면 푸터와 공지 띠가 다시 보인다", async ({ page }) => {
    await routeFakeNaverMaps(page);
    await page.goto("/map");
    await expect(page.getByRole("contentinfo")).toBeHidden();

    // 지도에서 나가는 링크는 헤더 로고를 쓴다. 가짜 지도(naver-maps-stub.ts)는 마커를 지도 상자 밖까지 늘어놓아 모바일 화면이 살짝 축소되고,
    // 그때 하단 탭 대신 body가 누름을 받는다(실제 지도는 넘친 부분을 숨긴다). event-map.spec.ts도 같은 링크로 지도를 떠난다.
    await page.getByRole("banner").getByRole("link", { name: "속초모아" }).click();

    await expect(page).toHaveURL(/:\d+\/$/);
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("complementary", { name: "새 공지" })).toBeVisible();
  });

  // 검색 화면은 화면 안 검색창과 겹치지 않게 넓은 화면의 헤더 검색창을 숨긴다. 검색 결과에서 상세로 가도 숨긴 채 남았다(2026-11-24 리뷰).
  test("검색 결과에서 상세로 가면 헤더 검색창이 다시 보이고, 검색으로 돌아오면 다시 숨는다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "헤더 검색창은 lg 이상에서만 보인다");
    const headerSearch = page.locator("[data-header-search]");
    await page.goto("/search?q=%EB%B0%94%EB%8B%A4%EB%B9%9B");
    await expect(headerSearch).toBeHidden();

    await page.getByRole("main").getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
    await expect(page).toHaveURL(/\/events\//);
    await expect(headerSearch).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/search\?q=/);
    await expect(headerSearch).toBeHidden();
  });
});

test.describe("다시 들어올 때의 초기화", () => {
  // 메뉴로 다시 들어오면 처음 상태, 뒤로 가기로 돌아오면 적던 글이 남는다(components/layout/fresh-on-new-visit.tsx).
  test("의견 폼은 뒤로 가기로 오면 적던 글이 남고, 메뉴로 다시 들어오면 비어 있다", async ({ page }) => {
    await page.goto("/feedback");
    await page.getByLabel(/제목/).fill("적다 만 의견");

    await primaryMenuLink(page, "행사").click();
    await expect(page).toHaveURL(/:\d+\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/feedback$/);
    await expect(page.getByLabel(/제목/)).toHaveValue("적다 만 의견");

    await page.getByRole("banner").getByRole("link", { name: "문의", exact: true }).click();
    await page.getByRole("main").getByRole("link", { name: /의견 보내기/ }).click();
    await expect(page).toHaveURL(/\/feedback$/);
    await expect(page.getByLabel(/제목/)).toHaveValue("");
  });

  test("헤더 돋보기로 검색에 다시 들어오면 입력창이 비어 있고 커서가 들어가 있다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "돋보기 링크는 lg 미만에서만 보인다");
    await page.goto("/places");
    const searchLink = page.getByRole("banner").getByRole("link", { name: "검색" });
    const field = page.getByRole("main").getByRole("textbox", { name: "행사, 장소 검색" });

    await searchLink.click();
    await expect(field).toBeFocused();
    await field.fill("적다 만 검색어");
    // 입력하는 동안에는 하단 탭을 숨기므로(globals.css의 data-hide-bottom-nav) 키보드를 닫은 뒤 탭을 누른다.
    await field.blur();

    await primaryMenuLink(page, "가볼만한 곳").click();
    await expect(page).toHaveURL(/\/places$/);
    await searchLink.click();

    await expect(field).toHaveValue("");
    await expect(field).toBeFocused();
  });

  // 접수 완료처럼 한 번 일어난 일을 세는 이벤트는 숨겨 둔 완료 화면이 다시 보여도 다시 세지 않는다(2026-11-24 사용자 결정).
  test("제보 접수 완료 이벤트는 뒤로 가기로 완료 화면에 돌아와도 한 번만 보낸다", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "DB 상태를 바꾸는 test는 desktop에서만 실행");
    await page.goto("/report");
    await page.getByLabel(/제목/).fill("다시 보이는 완료 화면 확인");
    await page.getByLabel(/본문/).fill("완료 화면에 뒤로 가기로 돌아와도 접수를 한 번만 셉니다.");
    await page.getByLabel(/^링크/).fill("https://example.com/event");
    await page.getByRole("button", { name: "제보 보내기", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("제보가 접수되었습니다.");
    await expect.poll(() => analyticsEventParams(page, "event_report_submitted")).toHaveLength(1);

    await primaryMenuLink(page, "행사").click();
    await expect(page).toHaveURL(/:\d+\/$/);
    await page.goBack();
    await expect(page.getByRole("status")).toContainText("제보가 접수되었습니다.");

    expect(await analyticsEventParams(page, "event_report_submitted")).toHaveLength(1);
  });
});
