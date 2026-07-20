import { expect, test } from "@playwright/test";

test("헤더에서 의견 보내기 폼으로 이동하고 링크 없이 의견을 작성할 수 있다", async ({ page }) => {
  await page.goto("/");

  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "행사 제보하기", exact: true })).toBeVisible();
  const feedbackLink = header.getByRole("link", { name: "의견 보내기", exact: true });
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
  await expect(image).toBeDisabled();
  await expect(page.getByText(/현재 환경에서는 사진 첨부를 사용할 수 없습니다/)).toBeVisible();

  await title.fill("필터 사용 의견");
  await body.fill("필터를 적용한 상태가 캘린더에서도 유지되어서 편리합니다.");
  await link.fill("https://example.com/feedback");
  await page.getByRole("button", { name: "의견 보내기", exact: true }).click();

  await expect(page.locator("form").getByRole("alert")).toHaveText("현재 의견 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.");
  await expect(title).toHaveValue("필터 사용 의견");
  await expect(body).toHaveValue("필터를 적용한 상태가 캘린더에서도 유지되어서 편리합니다.");
  await expect(link).toHaveValue("https://example.com/feedback");
});

test("행사 제보 전송에 실패해도 작성한 내용이 유지된다", async ({ page }) => {
  await page.goto("/report");

  const title = page.getByLabel(/제목/);
  const body = page.getByLabel(/본문/);
  const sourceUrl = page.getByLabel(/^링크/);
  await title.fill("속초 시민 행사 제보");
  await body.fill("다음 달 시민회관에서 열리는 행사 정보를 제보합니다.");
  await sourceUrl.fill("https://example.com/event");
  await page.getByRole("button", { name: "제보 보내기", exact: true }).click();

  await expect(page.locator("form").getByRole("alert")).toHaveText("현재 제보 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.");
  await expect(title).toHaveValue("속초 시민 행사 제보");
  await expect(body).toHaveValue("다음 달 시민회관에서 열리는 행사 정보를 제보합니다.");
  await expect(sourceUrl).toHaveValue("https://example.com/event");
});
