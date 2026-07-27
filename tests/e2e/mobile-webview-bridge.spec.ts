import { expect, test } from "@playwright/test";
import {
  MOBILE_APP_USER_AGENT,
  MOBILE_EVENT_SAVE_PATH,
  parseMobileEventSaveUrl,
} from "../../lib/mobile/event-bridge";

const eventPath = "/events/demo-sea-family-festival";

test("앱 WebView 요청에만 검증 가능한 행사 저장 링크를 보여준다", async ({
  baseURL,
  browser,
  page,
}) => {
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const trustedOrigin = new URL(baseURL).origin;

  await page.goto(eventPath);
  await expect(page.getByRole("link", { name: "관심 행사 저장" })).toHaveCount(0);

  const appContext = await browser.newContext({
    userAgent: `SokchoMoaE2E ${MOBILE_APP_USER_AGENT}`,
  });
  const appPage = await appContext.newPage();

  try {
    await appPage.goto(new URL(eventPath, baseURL).toString());
    const saveLink = appPage.getByRole("link", { name: "관심 행사 저장" });
    await expect(saveLink).toBeVisible();

    const href = await saveLink.getAttribute("href");
    expect(href).toContain(`${MOBILE_EVENT_SAVE_PATH}?`);

    const saveMessage = parseMobileEventSaveUrl(
      new URL(href ?? "", baseURL).toString(),
      trustedOrigin,
    );
    expect(saveMessage?.event.slug).toBe("demo-sea-family-festival");
    expect(saveMessage?.type).toBe("save_event");
  } finally {
    await appContext.close();
  }
});
