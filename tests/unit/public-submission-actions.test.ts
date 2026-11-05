import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkPublicSubmissionRateLimit: vi.fn(),
  createAdminSupabaseClient: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkPublicSubmissionRateLimit: mocks.checkPublicSubmissionRateLimit,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: mocks.createAdminSupabaseClient,
}));

import { submitSiteFeedbackAction } from "@/features/feedback/actions";
import { submitEventReportAction } from "@/features/reports/actions";
import { initialFormActionState } from "@/lib/action-state";

function reportForm(sourceUrl = "https://example.com/event") {
  const data = new FormData();
  data.set("title", "속초 여름 축제");
  data.set("body", "속초해수욕장에서 열리는 여름 축제입니다.");
  data.set("sourceUrl", sourceUrl);
  data.set("website", "");
  return data;
}

function feedbackForm(linkUrl = "https://example.com/events") {
  const data = new FormData();
  data.set("title", "목록 의견");
  data.set("body", "행사 목록 화면에 대한 의견을 남깁니다.");
  data.set("linkUrl", linkUrl);
  data.set("website", "");
  return data;
}

const actions = [
  ["행사 제보", submitEventReportAction, reportForm, "event_reports"],
  ["서비스 의견", submitSiteFeedbackAction, feedbackForm, "site_feedback"],
] as const;

describe("방문자 제출 server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkPublicSubmissionRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });
    mocks.createAdminSupabaseClient.mockReturnValue({ from: mocks.from });
  });

  it.each(actions)("%s를 서버 전용 admin client로 저장한다", async (_, action, form, table) => {
    await expect(action(initialFormActionState, form())).resolves.toEqual({ error: null, success: true });
    expect(mocks.from).toHaveBeenCalledWith(table);
    expect(mocks.insert).toHaveBeenCalledOnce();
  });

  it.each(actions)("%s: 숨김 필드를 채운 봇 요청은 저장하지 않고 성공처럼 응답한다", async (_, action, form) => {
    const data = form();
    data.set("website", "spam");
    await expect(action(initialFormActionState, data)).resolves.toEqual({ error: null, success: true });
    expect(mocks.createAdminSupabaseClient).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it.each(actions)("%s: 허용하지 않는 URL은 DB client 생성 전에 거부한다", async (_, action, form) => {
    await expect(action(initialFormActionState, form("javascript:alert(1)"))).resolves.toMatchObject({ success: false });
    expect(mocks.createAdminSupabaseClient).not.toHaveBeenCalled();
    expect(mocks.checkPublicSubmissionRateLimit).not.toHaveBeenCalled();
  });

  it.each(actions)("%s: 저장 설정이 없으면 요청 제한보다 준비 중 안내를 먼저 한다", async (_, action, form) => {
    mocks.createAdminSupabaseClient.mockReturnValue(null);
    await expect(action(initialFormActionState, form())).resolves.toMatchObject({
      error: expect.stringContaining("준비 중"),
      success: false,
    });
    expect(mocks.checkPublicSubmissionRateLimit).not.toHaveBeenCalled();
  });

  it.each(actions)("%s: 요청 한도를 넘으면 저장하지 않는다", async (_, action, form) => {
    mocks.checkPublicSubmissionRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 125 });
    await expect(action(initialFormActionState, form())).resolves.toEqual({
      error: "요청이 많습니다. 약 3분 후 다시 시도해 주세요.",
      success: false,
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
