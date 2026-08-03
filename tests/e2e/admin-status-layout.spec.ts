import { expect, test, type Locator, type Page } from "@playwright/test";

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

async function boxes(page: Page) {
  const currentRow = page.getByRole("row").filter({ hasText: "현재 행사" });
  const adjacentRow = page.getByRole("row").filter({ hasText: "인접 행사" });
  const controls = currentRow.getByLabel("공개 상태 변경");
  const values = await Promise.all([
    controls.boundingBox(),
    currentRow.boundingBox(),
    adjacentRow.boundingBox(),
  ]);
  for (const value of values) expect(value).not.toBeNull();
  return values as Box[];
}

function expectStable(actual: Box[], baseline: Box[]) {
  for (let index = 0; index < baseline.length; index += 1) {
    for (const key of ["x", "y", "width", "height"] as const) {
      expect(Math.abs(actual[index][key] - baseline[index][key]), `${index}:${key}`).toBeLessThanOrEqual(1);
    }
  }
}

async function editBoxes(page: Page) {
  const section = page.getByRole("region", { name: "행사 수정 테스트" });
  const values = await Promise.all([
    section.getByLabel("공개 상태 변경").boundingBox(),
    page.getByTestId("edit-header").boundingBox(),
    page.getByTestId("edit-adjacent").boundingBox(),
  ]);
  for (const value of values) expect(value).not.toBeNull();
  return values as Box[];
}

test("실제 관리자 상태 컴포넌트가 저장·성공·실패 rollback 중 행을 이동시키지 않는다", async ({ page }) => {
  await page.goto("/e2e-test/admin-status");
  const currentRow = page.getByRole("row").filter({ hasText: "현재 행사" });
  const controls = currentRow.getByLabel("공개 상태 변경");
  const publishButton = currentRow.getByRole("button", { name: "공개", exact: true });
  await expect(currentRow.getByRole("cell", { name: "1,234회" })).toBeVisible();
  await controls.scrollIntoViewIfNeeded();
  const baseline = await boxes(page);

  await publishButton.click();
  await expect(controls).toHaveAttribute("aria-busy", "true");
  expectStable(await boxes(page), baseline);
  await expect(controls.getByRole("status")).toHaveText("변경 사항을 저장하고 있습니다.");

  await expect(controls).toHaveAttribute("aria-busy", "false");
  expectStable(await boxes(page), baseline);
  await expect(currentRow).toContainText("공개");

  await page.getByLabel("실패").evaluate((element: HTMLInputElement) => element.click());
  await currentRow.getByRole("button", { name: "반려", exact: true }).click();
  await expect(controls).toHaveAttribute("aria-busy", "true");
  expectStable(await boxes(page), baseline);

  await expect(controls.getByRole("status")).toBeVisible();
  await expect(controls.getByRole("status")).toHaveText("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  await expect(controls).toHaveAttribute("aria-busy", "false");
  expectStable(await boxes(page), baseline);
  await expect(currentRow).toContainText("공개");
});

test("실제 행사 수정 화면 상태 컨트롤이 저장·성공·실패 rollback 중 인접 영역을 이동시키지 않는다", async ({ page }) => {
  await page.goto("/e2e-test/admin-status");
  const section = page.getByRole("region", { name: "행사 수정 테스트" });
  const controls = section.getByLabel("공개 상태 변경");
  const publishButton = controls.getByRole("button", { name: "공개", exact: true });
  await controls.scrollIntoViewIfNeeded();
  const baseline = await editBoxes(page);

  await publishButton.click();
  await expect(controls).toHaveAttribute("aria-busy", "true");
  expectStable(await editBoxes(page), baseline);
  await expect(controls.getByRole("status")).toHaveText("변경 사항을 저장하고 있습니다.");

  await expect(controls).toHaveAttribute("aria-busy", "false");
  expectStable(await editBoxes(page), baseline);
  await expect(publishButton).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("실패").evaluate((element: HTMLInputElement) => element.click());
  await controls.getByRole("button", { name: "반려", exact: true }).click();
  await expect(controls).toHaveAttribute("aria-busy", "true");
  expectStable(await editBoxes(page), baseline);

  await expect(controls.getByRole("status")).toBeVisible();
  await expect(controls.getByRole("status")).toHaveText("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  await expect(controls).toHaveAttribute("aria-busy", "false");
  expectStable(await editBoxes(page), baseline);
  await expect(publishButton).toHaveAttribute("aria-pressed", "true");
});

test("관리자 대시보드 목록에서 확인 후 행사를 삭제할 수 있다", async ({ page }) => {
  await page.goto("/e2e-test/admin-status");
  const currentRow = page.getByRole("row").filter({ hasText: "현재 행사" });

  await currentRow.getByRole("button", { name: "삭제", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "현재 행사 삭제" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("삭제한 행사는 복구할 수 없으며, 연결된 출처 기록과 운영 회차도 함께 삭제됩니다.")).toBeVisible();
  await expect(dialog.locator('input[name="id"]')).toHaveValue("10000000-0000-4000-8000-000000000091");
  await expect(dialog.locator('input[name="slug"]')).toHaveValue("e2e-current");
  await expect(dialog.locator('input[name="confirmation"]')).toHaveValue("delete");
  await expect(dialog.getByRole("checkbox")).toHaveCount(0);

  const box = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box && viewport) {
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);
  }

  await dialog.getByRole("button", { name: "취소", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});
