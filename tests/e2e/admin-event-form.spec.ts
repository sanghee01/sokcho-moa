import { expect, test } from "@playwright/test";
import { E2E_ADMIN_EVENT, loginAsAdmin } from "./fixtures";
import path from "node:path";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test("행사 작성 폼은 필수 입력을 요구하고, 자동으로 채우는 기술 필드는 노출하지 않는다", async ({ page }) => {
  await page.goto("/admin/events/new");

  for (const field of [
    page.getByRole("textbox", { name: /행사명.*필수/ }),
    page.getByRole("combobox", { name: /카테고리.*필수/ }),
    page.getByRole("textbox", { name: /출처 기관.*필수/ }),
    page.getByRole("textbox", { name: /행사 안내 URL.*필수/ }),
  ]) {
    await expect(field).toHaveAttribute("required", "");
  }

  for (const name of ["slug", "latitude", "longitude", "locationSourceUrl", "locationVerifiedAt", "lastVerifiedAt", "officialUrl"]) {
    await expect(page.locator(`[name="${name}"]`)).toHaveCount(0);
  }

  // 참여 대상은 하나 이상 고르면 나머지의 필수 표시가 풀린다.
  const firstAudience = page.getByRole("checkbox", { name: "아동" });
  await expect(firstAudience).toHaveAttribute("required", "");
  await page.getByRole("checkbox", { name: "성인" }).check();
  await expect(firstAudience).not.toHaveAttribute("required", "");
  await expect(page.getByRole("button", { name: "작성 완료" })).toBeVisible();
});

test("대표 이미지는 3MB를 넘으면 거부하고, 올바른 이미지는 미리보기 후 업로드할 수 있다", async ({ page }) => {
  await page.goto("/admin/events/new");
  const linksSection = page.locator('section[aria-labelledby="event-links-title"]');
  const imageInput = linksSection.locator('input[type="file"][name="image"]');
  const uploadImageButton = linksSection.getByRole("button", { name: "이미지 업로드" });
  await expect(uploadImageButton).toBeDisabled();

  await imageInput.setInputFiles({
    name: "too-large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(Math.ceil(3.5 * 1024 * 1024)),
  });
  await expect(linksSection.getByText(/3MB 이하/)).toBeVisible();
  await expect(imageInput).toHaveValue("");
  await expect(uploadImageButton).toBeDisabled();

  await imageInput.setInputFiles(path.join(process.cwd(), "app", "icon.jpeg"));
  await expect(linksSection.getByRole("img", { name: "대표 이미지 미리보기" })).toBeVisible();
  await expect(linksSection.getByText(/3MB 이하/)).toHaveCount(0);
  await expect(uploadImageButton).toBeEnabled();
});

test("행사 수정 폼은 저장된 값을 불러오고 기존 slug를 숨김 값으로 유지한다", async ({ page }) => {
  await page.goto(`/admin/events/${E2E_ADMIN_EVENT.id}`);

  const editForm = page.locator("form.event-form");
  await expect(editForm.locator('input[type="hidden"][name="slug"]')).toHaveValue(E2E_ADMIN_EVENT.slug);
  await expect(page.locator('[name="latitude"]')).toHaveCount(0);
  await expect(page.locator('[name="officialUrl"]')).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "운영일정" })).toHaveValue("매일 10:00~18:00\n마지막 날은 17:00까지");
  await expect(page.getByRole("button", { name: "수정 완료" })).toBeVisible();

  await page.getByRole("button", { name: "삭제", exact: true }).click();
  const deleteDialog = page.getByRole("dialog", { name: `${E2E_ADMIN_EVENT.title} 삭제` });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "취소", exact: true }).click();
  await expect(deleteDialog).not.toBeVisible();
});
