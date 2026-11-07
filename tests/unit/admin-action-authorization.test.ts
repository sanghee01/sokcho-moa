import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 관리자 server action은 화면 보호와 별개로 직접 호출될 수 있다. 관리자가 아니면 DB client를 만들기 전에
// 멈추는지(쓰기·캐시 무효화·외부 요청 없음)를 모든 export된 action에 대해 확인한다.
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createSessionSupabaseClient: vi.fn(),
  createAdminSupabaseClient: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

class LoginRedirect extends Error {
  // next/navigation의 redirect()가 던지는 오류와 같은 표식(digest)을 쓴다.
  digest = "NEXT_REDIRECT;replace;/admin/login;307;";
}

/** DB client 생성까지 도달했다는 표식. 관리자일 때 입력이 검증을 통과하는지 확인하는 대조군에서 쓴다. */
class ReachedDatabase extends Error {}

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ createSessionSupabaseClient: mocks.createSessionSupabaseClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: mocks.createAdminSupabaseClient }));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
  updateTag: mocks.updateTag,
}));

import * as eventActions from "@/features/events/admin/actions";
import * as eventImageActions from "@/features/events/admin/image/actions";
import * as eventImportActions from "@/features/events/admin/candidate/actions";
import * as feedbackActions from "@/features/feedback/admin/actions";
import * as placeActions from "@/features/places/admin/actions";
import * as reportActions from "@/features/reports/admin/actions";

const ID = "3f2b8c1e-5d4a-4e6b-9c7d-0a1b2c3d4e5f";
const adminState = { error: null };
const imageState = { error: null, publicUrl: null, uploadedPath: null, selectionToken: null, fileName: null };

function form(values: Record<string, string | string[] | File>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const candidateJson = JSON.stringify({
  title: "속초 여름 음악회",
  summary: null,
  description: null,
  category: "performance",
  audiences: ["family"],
  eventStartAt: "2026-08-15T10:00:00+09:00",
  eventEndAt: null,
  operatingHours: null,
  applicationStartAt: null,
  applicationEndAt: null,
  locationName: null,
  address: null,
  latitude: null,
  longitude: null,
  priceText: null,
  isFree: true,
  organizer: null,
  contact: null,
  officialUrl: null,
  applicationUrl: null,
  imageUrl: null,
  sourceName: "속초문화재단",
  sourceUrl: "https://example.org/events/summer-concert-2026",
});

/** [모듈, action 이름, 관리자라면 DB까지 도달하는 입력으로 action을 부르는 함수] */
const cases: Array<[string, string, () => Promise<unknown>]> = [
  ["events/admin/actions", "saveEventAction", () => eventActions.saveEventAction(adminState, form({
    slug: "summer-concert",
    title: "속초 여름 음악회",
    category: "performance",
    audiences: "family",
    eventStartAt: "2026-08-15",
    eventEndAt: "2026-08-15",
    isFree: "true",
    sourceName: "속초문화재단",
    sourceUrl: "https://example.org/events/summer-concert-2026",
  }))],
  ["events/admin/actions", "setEventReviewStatusAction", () => eventActions.setEventReviewStatusAction({
    id: ID,
    slug: "summer-concert",
    status: "published",
  })],
  ["events/admin/actions", "deleteEventAction", () => eventActions.deleteEventAction(adminState, form({ id: ID, confirmation: "delete" }))],
  ["events/admin/actions", "releaseEventCollectionExclusionAction", () => eventActions.releaseEventCollectionExclusionAction(
    adminState,
    form({ id: ID }),
  )],
  ["events/admin/candidate/actions", "importEventCandidateAction", () => eventImportActions.importEventCandidateAction(
    adminState,
    form({ candidateJson }),
  )],
  ["events/admin/image/actions", "uploadEventImageAction", () => eventImageActions.uploadEventImageAction(imageState, form({
    image: new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "poster.jpg", { type: "image/jpeg" }),
    imageSelectionToken: "selection-1",
  }))],
  ["places/admin/actions", "savePlaceAction", () => placeActions.savePlaceAction(adminState, form({
    slug: "yeonggeumjeong",
    name: "영금정",
    category: "landmark",
    latitude: "38.2132",
    longitude: "128.6005",
    isPublished: "on",
  }))],
  ["places/admin/actions", "deletePlaceAction", () => placeActions.deletePlaceAction(adminState, form({ id: ID, confirmation: "delete" }))],
  ["reports/admin/actions", "setEventReportReviewStatusAction", () => reportActions.setEventReportReviewStatusAction({
    id: ID,
    status: "reviewed",
  })],
  ["reports/admin/actions", "deleteEventReportAction", () => reportActions.deleteEventReportAction({ id: ID })],
  ["feedback/admin/actions", "setSiteFeedbackReviewStatusAction", () => feedbackActions.setSiteFeedbackReviewStatusAction({
    id: ID,
    status: "reviewed",
  })],
  ["feedback/admin/actions", "deleteSiteFeedbackAction", () => feedbackActions.deleteSiteFeedbackAction({ id: ID })],
];

const modules = {
  "events/admin/actions": eventActions,
  "events/admin/candidate/actions": eventImportActions,
  "events/admin/image/actions": eventImageActions,
  "places/admin/actions": placeActions,
  "reports/admin/actions": reportActions,
  "feedback/admin/actions": feedbackActions,
};

describe("관리자 server action 인가", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockRejectedValue(new LoginRedirect("NEXT_REDIRECT"));
    mocks.createSessionSupabaseClient.mockRejectedValue(new ReachedDatabase("DB client에 도달했습니다."));
    mocks.createAdminSupabaseClient.mockImplementation(() => {
      throw new ReachedDatabase("service_role client에 도달했습니다.");
    });
    fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("외부 요청을 보내면 안 됩니다."));
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("관리자 action 모듈의 export가 모두 아래 표에 있다(새 action을 추가하면 표에도 추가한다)", () => {
    const exported = Object.entries(modules).flatMap(([moduleName, module]) => (
      Object.entries(module)
        .filter(([, value]) => typeof value === "function")
        .map(([name]) => `${moduleName}#${name}`)
    ));
    const covered = cases.map(([moduleName, name]) => `${moduleName}#${name}`);

    expect(covered.sort()).toEqual(exported.sort());
  });

  it.each(cases)("%s#%s: 관리자가 아니면 로그인으로 보내고 DB·캐시·외부 요청을 하지 않는다", async (_, __, call) => {
    await expect(call()).rejects.toBeInstanceOf(LoginRedirect);

    expect(mocks.requireAdmin).toHaveBeenCalled();
    expect(mocks.createSessionSupabaseClient).not.toHaveBeenCalled();
    expect(mocks.createAdminSupabaseClient).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
    expect(mocks.updateTag).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // 대조군: 같은 입력이 관리자일 때는 검증을 통과해 DB client까지 간다. 그래서 위 test의 "DB에 가지 않음"은
  // 입력 검증 실패가 아니라 인가 실패 때문임이 보장된다.
  it.each(cases)("%s#%s: 관리자면 같은 입력이 DB client까지 도달한다", async (_, __, call) => {
    mocks.requireAdmin.mockResolvedValue({ id: ID, email: "admin@example.com" });

    await expect(call()).rejects.toBeInstanceOf(ReachedDatabase);
    expect(mocks.createSessionSupabaseClient).toHaveBeenCalledOnce();
  });
});
