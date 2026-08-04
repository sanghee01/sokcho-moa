import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkPublicSubmissionRateLimit: vi.fn(),
  createServiceRoleSupabaseClient: vi.fn(),
  isServiceRoleSupabaseConfigured: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admin/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/security/public-submission-rate-limit", () => ({
  checkPublicSubmissionRateLimit: mocks.checkPublicSubmissionRateLimit,
}));
vi.mock("@/lib/supabase/auth-server", () => ({ createAuthenticatedSupabaseClient: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
  isServiceRoleSupabaseConfigured: mocks.isServiceRoleSupabaseConfigured,
}));

import { submitSiteFeedbackAction } from "@/lib/actions/feedback";
import { submitEventReportAction } from "@/lib/actions/reports";

function reportForm(sourceUrl = "https://example.com/event") {
  const data = new FormData();
  data.set("title", "속초 여름 축제");
  data.set("body", "속초해수욕장에서 열리는 여름 축제입니다.");
  data.set("sourceUrl", sourceUrl);
  data.set("website", "");
  return data;
}

function feedbackForm(linkUrl = "https://example.com/calendar") {
  const data = new FormData();
  data.set("title", "캘린더 의견");
  data.set("body", "캘린더 화면에 대한 의견을 남깁니다.");
  data.set("linkUrl", linkUrl);
  data.set("website", "");
  return data;
}

describe("public submission Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkPublicSubmissionRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.isServiceRoleSupabaseConfigured.mockReturnValue(true);
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });
    mocks.createServiceRoleSupabaseClient.mockReturnValue({ from: mocks.from });
  });

  it("행사 제보를 서버 전용 서비스 역할로 저장한다", async () => {
    await expect(submitEventReportAction({ error: null, success: false }, reportForm())).resolves.toEqual({
      error: null,
      success: true,
    });

    expect(mocks.createServiceRoleSupabaseClient).toHaveBeenCalledOnce();
    expect(mocks.from).toHaveBeenCalledWith("event_reports");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ source_url: "https://example.com/event" }));
  });

  it("사이트 의견을 서버 전용 서비스 역할로 저장한다", async () => {
    await expect(submitSiteFeedbackAction({ error: null, success: false }, feedbackForm())).resolves.toEqual({
      error: null,
      success: true,
    });

    expect(mocks.createServiceRoleSupabaseClient).toHaveBeenCalledOnce();
    expect(mocks.from).toHaveBeenCalledWith("site_feedback");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ link_url: "https://example.com/calendar" }));
  });

  it.each([submitEventReportAction, submitSiteFeedbackAction])(
    "허용하지 않는 URL은 DB client 생성 전에 거부한다",
    async (action) => {
      const data = action === submitEventReportAction
        ? reportForm("javascript:alert(1)")
        : feedbackForm("javascript:alert(1)");

      await expect(action({ error: null, success: false }, data)).resolves.toMatchObject({ success: false });
      expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
      expect(mocks.checkPublicSubmissionRateLimit).not.toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
    },
  );

  it.each([submitEventReportAction, submitSiteFeedbackAction])(
    "Supabase 쓰기가 준비되지 않으면 요청 제한보다 구성 안내를 우선한다",
    async (action) => {
      mocks.isServiceRoleSupabaseConfigured.mockReturnValue(false);
      const data = action === submitEventReportAction ? reportForm() : feedbackForm();

      await expect(action({ error: null, success: false }, data)).resolves.toMatchObject({
        error: expect.stringContaining("준비 중"),
        success: false,
      });
      expect(mocks.checkPublicSubmissionRateLimit).not.toHaveBeenCalled();
      expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
    },
  );

  it.each([submitEventReportAction, submitSiteFeedbackAction])(
    "요청 한도를 넘으면 DB 쓰기 전에 거부한다",
    async (action) => {
      mocks.checkPublicSubmissionRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 125 });
      const data = action === submitEventReportAction ? reportForm() : feedbackForm();

      await expect(action({ error: null, success: false }, data)).resolves.toEqual({
        error: "요청이 많습니다. 약 3분 후 다시 시도해 주세요.",
        success: false,
      });
      expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
    },
  );
});
