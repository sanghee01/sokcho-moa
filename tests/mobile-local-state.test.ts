import { describe, expect, it } from "vitest";
import {
  createDefaultLocalAppState,
  readLocalAppState,
  removeSavedEvent,
  saveEvent,
  setNotificationPreference,
  toggleAudience,
  toggleCategory,
} from "@/apps/mobile/src/local-app-state";
import {
  createEventWebUrl,
  isTrustedWebUrl,
  resolveWebOrigin,
} from "@/apps/mobile/src/web-url";
import type { MobileEventSummary } from "@/lib/mobile/event-bridge";

const event: MobileEventSummary = {
  id: "10000000-0000-4000-8000-000000000003",
  slug: "youth-coding-class",
  title: "청소년 코딩 교실",
  category: "education",
  audiences: ["youth"],
  eventStartAt: "2026-08-10T10:00:00+09:00",
  eventEndAt: null,
  applicationEndAt: "2026-08-08T18:00:00+09:00",
};

describe("mobile local app state", () => {
  it("uses a private, opt-in default state when storage is empty or corrupt", () => {
    expect(readLocalAppState(null)).toEqual(createDefaultLocalAppState());
    expect(readLocalAppState("{broken")).toEqual(createDefaultLocalAppState());
  });

  it("toggles interests and notification consent predictably", () => {
    let state = createDefaultLocalAppState();
    state = toggleCategory(state, "education");
    state = toggleAudience(state, "youth");
    state = setNotificationPreference(state, "newEvents", true);

    expect(state.categories).toEqual(["education"]);
    expect(state.audiences).toEqual(["youth"]);
    expect(state.notifications).toEqual({
      newEvents: true,
      closingSoon: false,
    });

    expect(toggleCategory(state, "education").categories).toEqual([]);
  });

  it("stores one newest record per event and lets the user remove it", () => {
    const firstSave = saveEvent(
      createDefaultLocalAppState(),
      event,
      "2026-07-26T01:00:00.000Z",
    );
    const secondSave = saveEvent(
      firstSave,
      { ...event, title: "수정된 청소년 코딩 교실" },
      "2026-07-26T02:00:00.000Z",
    );

    expect(secondSave.savedEvents).toHaveLength(1);
    expect(secondSave.savedEvents[0]).toMatchObject({
      slug: event.slug,
      title: "수정된 청소년 코딩 교실",
      savedAt: "2026-07-26T02:00:00.000Z",
    });
    expect(removeSavedEvent(secondSave, event.slug).savedEvents).toEqual([]);
  });

  it("drops unsupported values while restoring valid saved data", () => {
    const restored = readLocalAppState(JSON.stringify({
      version: 1,
      categories: ["education", "unknown", "education"],
      audiences: ["youth", 3],
      notifications: { newEvents: true, closingSoon: "yes" },
      savedEvents: [
        { ...event, savedAt: "2026-07-26T01:00:00.000Z" },
        { ...event, title: "duplicate", savedAt: "2026-07-26T02:00:00.000Z" },
        { ...event, slug: "../admin", savedAt: "2026-07-26T03:00:00.000Z" },
      ],
    }));

    expect(restored.categories).toEqual(["education"]);
    expect(restored.audiences).toEqual(["youth"]);
    expect(restored.notifications).toEqual({
      newEvents: true,
      closingSoon: false,
    });
    expect(restored.savedEvents).toHaveLength(1);
    expect(restored.savedEvents[0]?.title).toBe(event.title);
  });
});

describe("mobile WebView origin boundary", () => {
  it("uses only http(s) origins and falls back from invalid configuration", () => {
    expect(resolveWebOrigin("http://127.0.0.1:3100/events/demo"))
      .toBe("http://127.0.0.1:3100");
    expect(resolveWebOrigin("javascript:alert(1)"))
      .toBe("https://sokcho-moa.vercel.app");
  });

  it("keeps same-origin pages inside and builds encoded event URLs", () => {
    const origin = "https://sokcho-moa.vercel.app";
    expect(isTrustedWebUrl(`${origin}/events/demo`, origin)).toBe(true);
    expect(isTrustedWebUrl("https://example.com/events/demo", origin)).toBe(false);
    expect(createEventWebUrl(origin, "family festival"))
      .toBe(`${origin}/events/family%20festival`);
  });
});
