import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupUnusedEventImage, eventImagePathFromPublicUrl } from "@/features/events/admin/image/storage";

const BASE = "http://127.0.0.1:54321/storage/v1/object/public/event-images";

const state = vi.hoisted(() => ({ referenceCount: 0, removed: [] as string[] }));

function fakeClient() {
  const query = {
    select: () => query,
    eq: async () => ({ count: state.referenceCount, error: null }),
  };
  return {
    from: () => query,
    storage: {
      from: () => ({
        remove: async (paths: string[]) => {
          state.removed.push(...paths);
          return { error: null };
        },
      }),
    },
  } as never;
}

describe("행사 이미지 정리", () => {
  beforeEach(() => {
    state.referenceCount = 0;
    state.removed = [];
  });

  it("공개 URL에서 우리 bucket의 events/ 경로만 꺼낸다", () => {
    expect(eventImagePathFromPublicUrl(`${BASE}/events/a.webp`)).toBe("events/a.webp");
    expect(eventImagePathFromPublicUrl("https://www.sokcho.go.kr/poster.jpg")).toBeNull();
    expect(eventImagePathFromPublicUrl(`${BASE}/../feedback-images/x.webp`)).toBeNull();
    expect(eventImagePathFromPublicUrl(null)).toBeNull();
  });

  it("이미지를 바꾸거나 지우면, 더 이상 아무 행사도 쓰지 않는 이전 파일을 지운다", async () => {
    await cleanupUnusedEventImage(fakeClient(), `${BASE}/events/old.webp`, `${BASE}/events/new.webp`);
    await cleanupUnusedEventImage(fakeClient(), `${BASE}/events/cleared.webp`, null);
    expect(state.removed).toEqual(["events/old.webp", "events/cleared.webp"]);
  });

  it("같은 이미지를 유지하거나, 다른 행사가 아직 쓰거나, 외부 URL이면 지우지 않는다", async () => {
    await cleanupUnusedEventImage(fakeClient(), `${BASE}/events/same.webp`, `${BASE}/events/same.webp`);
    await cleanupUnusedEventImage(fakeClient(), "https://www.sokcho.go.kr/poster.jpg", null);
    state.referenceCount = 1;
    await cleanupUnusedEventImage(fakeClient(), `${BASE}/events/shared.webp`, null);
    expect(state.removed).toEqual([]);
  });
});
