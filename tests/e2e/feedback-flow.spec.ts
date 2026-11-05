import { expect, test } from "@playwright/test";

test("푸터에서 의견 보내기 폼으로 이동해 링크 없이도 의견을 보낼 수 있다", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "행사 제보하기", exact: true })).toBeVisible();
  const feedbackLink = footer.getByRole("link", { name: "의견 보내기", exact: true });
  await expect(feedbackLink).toBeVisible();
  await feedbackLink.click();

  await expect(page).toHaveURL(/\/feedback$/);
  await expect(page.getByRole("heading", { level: 1, name: "의견 보내기" })).toBeVisible();
  await expect(page.getByText(/불편했던 점, 개선하면 좋을 점/).first()).toBeVisible();

  const title = page.getByLabel(/제목/);
  const body = page.getByLabel(/본문/);
  const link = page.getByRole("textbox", { name: /^관련 링크/ });
  const image = page.getByLabel(/^사진 첨부/);
  await expect(title).toHaveAttribute("required", "");
  await expect(body).toHaveAttribute("required", "");
  await expect(link).not.toHaveAttribute("required", "");
  await expect(image).not.toHaveAttribute("required", "");
  await expect(image).toBeEnabled();
  await expect(page.getByText(/화면을 설명하는 사진 1장을 첨부할 수 있습니다/)).toBeVisible();

  await title.fill("필터 사용 의견");
  await body.fill("필터를 적용한 상태가 목록 이동 뒤에도 유지되어서 편리합니다.");
  await page.getByRole("button", { name: "의견 보내기", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("의견을 보내주셔서 감사합니다.");
});

test("행사 제보는 서버 검증에 실패하면 작성한 내용을 유지하고, 고치면 접수된다", async ({ page }) => {
  await page.goto("/report");

  const title = page.getByLabel(/제목/);
  const body = page.getByLabel(/본문/);
  const sourceUrl = page.getByLabel(/^링크/);
  await title.fill("속초 시민 행사 제보");
  await body.fill("다음 달 시민회관에서 열리는 행사 정보를 제보합니다.");
  // 브라우저는 javascript: 주소를 URL로 통과시키지만, 서버 검증이 http(s)만 허용한다.
  await sourceUrl.fill("javascript:alert(1)");
  await page.getByRole("button", { name: "제보 보내기", exact: true }).click();

  await expect(page.locator("form").getByRole("alert")).toHaveText("링크를 올바른 주소로 입력해 주세요.");
  await expect(title).toHaveValue("속초 시민 행사 제보");
  await expect(body).toHaveValue("다음 달 시민회관에서 열리는 행사 정보를 제보합니다.");

  await sourceUrl.fill("https://example.com/event");
  await page.getByRole("button", { name: "제보 보내기", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("제보가 접수되었습니다.");
});
