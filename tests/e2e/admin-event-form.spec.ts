import { expect, test } from "@playwright/test";
import path from "node:path";

test("행사 작성 폼이 필수 입력과 공개 버튼 생성을 설명하고 기술 필드를 숨긴다", async ({ page }, testInfo) => {
  await page.goto("/e2e-test/event-form");

  await expect(page.getByRole("heading", { name: "기본 정보" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "일정·신청" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "장소·요금" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "링크·출처" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "노출 설정" })).toBeVisible();
  const titleInput = page.getByRole("textbox", { name: /행사명.*필수/ });
  await expect(titleInput).toHaveAttribute("required", "");
  await expect(titleInput).toHaveAttribute("placeholder", "예: 2026 속초 여름 바다축제");
  await titleInput.focus();
  await expect(titleInput).toHaveCSS("outline-style", "auto");
  await expect(page.getByRole("combobox", { name: /카테고리.*필수/ })).toHaveAttribute("required", "");
  await expect(page.getByRole("textbox", { name: /출처 기관.*필수/ })).toHaveAttribute("required", "");
  await expect(page.getByRole("textbox", { name: /행사 안내 URL.*필수/ })).toHaveAttribute("required", "");
  await expect(page.getByRole("textbox", { name: "운영일정" })).toHaveAttribute("rows", "4");
  await expect(page.getByRole("textbox", { name: "문의처 전화번호" })).toHaveAttribute("placeholder", "예: 033-639-0000");
  await expect(page.getByRole("textbox", { name: "문의처 전화번호" })).toHaveAttribute("type", "tel");
  await expect(page.getByText("행사 내용과 신청 방법을 문의할 수 있는 주최 기관의 전화번호를 입력하세요.")).toBeVisible();
  const linksSection = page.locator('section[aria-labelledby="event-links-title"]');
  const imageInput = linksSection.locator('input[type="file"][name="image"]');
  const previewPanel = linksSection.getByTestId("event-image-upload-panel");
  const initialPreviewSize = await previewPanel.boundingBox();
  await expect(imageInput).toHaveCount(1);
  const selectImageButton = linksSection.getByRole("button", { name: "파일 선택" });
  const uploadImageButton = linksSection.getByRole("button", { name: "이미지 업로드" });
  await expect(selectImageButton).toBeVisible();
  await expect(uploadImageButton).toBeVisible();
  await expect(uploadImageButton).toBeDisabled();
  await expect(linksSection.getByRole("img", { name: "대표 이미지 미리보기 없음" })).toBeVisible();
  await imageInput.setInputFiles({
    name: "too-large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(Math.ceil(5.5 * 1024 * 1024)),
  });
  await expect(linksSection.getByText("선택한 파일은 5.5MB입니다. 5MB 이하 이미지를 선택해 주세요.")).toBeVisible();
  await expect(imageInput).toHaveValue("");
  await expect(uploadImageButton).toBeDisabled();
  await imageInput.setInputFiles(path.join(process.cwd(), "app", "icon.jpeg"));
  await expect(linksSection.getByRole("img", { name: "대표 이미지 미리보기" })).toBeVisible();
  await expect(linksSection.getByText("icon.jpeg · 업로드 대기", { exact: true })).toBeVisible();
  await expect(linksSection.getByText("선택한 파일은 5.5MB입니다.", { exact: false })).toHaveCount(0);
  await expect(uploadImageButton).toBeEnabled();
  expect(await previewPanel.boundingBox()).toEqual(initialPreviewSize);
  await expect(linksSection.getByText("파일 선택 후 ‘이미지 업로드’를 누르세요.", { exact: false })).toBeVisible();
  await expect(page.getByText("현재는 검색엔진용 사이트맵 우선순위만 높아지며, 홈이나 행사 목록의 노출 순서는 바뀌지 않습니다.")).toBeVisible();
  await expect(page.getByLabel("공개 버튼 생성 안내")).toContainText("공유하기");
  await expect(page.getByRole("button", { name: "작성 완료" })).toBeVisible();

  for (const name of ["slug", "latitude", "longitude", "locationSourceUrl", "locationVerifiedAt", "lastVerifiedAt", "officialUrl"]) {
    await expect(page.locator(`[name="${name}"]`)).toHaveCount(0);
  }

  const firstAudience = page.getByRole("checkbox", { name: "아동" });
  await expect(firstAudience).toHaveAttribute("required", "");
  await page.getByRole("checkbox", { name: "성인" }).check();
  await expect(firstAudience).not.toHaveAttribute("required", "");

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("admin-event-form-new.png"), fullPage: true });
});

test("행사 수정 폼은 기존 slug를 내부에서 유지하고 문맥에 맞는 완료 동작을 보여준다", async ({ page }, testInfo) => {
  await page.goto("/e2e-test/event-form?mode=edit");

  const editForm = page.locator("form").first();
  await expect(editForm.locator('input[type="hidden"][name="slug"]')).toHaveValue("existing-event-slug");
  await expect(page.locator('[name="latitude"]')).toHaveCount(0);
  await expect(page.locator('[name="officialUrl"]')).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "운영일정" })).toHaveValue("8월 1일 10:00~18:00\n8월 2일 11:00~17:00");
  await expect(page.getByRole("button", { name: "수정 완료" })).toBeVisible();
  await expect(page.getByText("완료하면 관리자 대시보드로 이동합니다.")).toBeVisible();
  await expect(page.locator('input[type="file"][name="image"]')).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Storage에 업로드" })).toHaveCount(0);

  await page.getByRole("button", { name: "삭제", exact: true }).click();
  const deleteDialog = page.getByRole("dialog", { name: "기존 행사 수정 테스트 삭제" });
  await expect(deleteDialog).toBeVisible();
  await expect(deleteDialog.getByRole("checkbox")).toHaveCount(0);
  await expect(deleteDialog.getByText("같은 행사가 다시 수집되지 않도록", { exact: false })).toBeVisible();
  await deleteDialog.getByRole("button", { name: "취소", exact: true }).click();
  await expect(deleteDialog).not.toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("admin-event-form-edit.png"), fullPage: true });
});

test("작성과 수정 완료 후 대시보드 성공 메시지를 구분한다", async ({ page }) => {
  await page.goto("/e2e-test/event-form?saved=event-created");
  await expect(page.getByRole("status")).toHaveText("새 행사를 검수 대기로 등록했습니다.");

  await page.goto("/e2e-test/event-form?saved=event-updated");
  await expect(page.getByRole("status")).toHaveText("행사 정보를 수정했습니다.");
});

test("행사 상세는 중복 관련 링크 없이 행동 버튼을 한 번씩 보여준다", async ({ page }, testInfo) => {
  await page.goto("/events/demo-sea-family-festival");

  await expect(page.getByRole("link", { name: "행사 안내 (새 창)" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "공유하기" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /신청·예매/ })).toHaveCount(0);
  await expect(page.getByText("관련 링크", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.screenshot({ path: testInfo.outputPath("event-detail-actions.png"), fullPage: true });
});
