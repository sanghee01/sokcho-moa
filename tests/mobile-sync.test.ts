import { describe, expect, it, vi } from "vitest";
import {
  buildMobileSyncSnapshot,
  ensureAnonymousUser,
  findStaleRemoteEventIds,
} from "@/apps/mobile/src/supabase/anonymous-sync";
import { readMobileSupabaseConfig } from "@/apps/mobile/src/supabase/supabase-config";
import {
  createDefaultLocalAppState,
  saveEvent,
  setNotificationPreference,
  toggleAudience,
  toggleCategory,
} from "@/apps/mobile/src/local-app-state";
import type { MobileEventSummary } from "@/lib/mobile/event-bridge";

const userId = "20000000-0000-4000-8000-000000000001";
const event: MobileEventSummary = {
  id: "10000000-0000-4000-8000-000000000003",
  slug: "youth-coding-class",
  title: "청소년 코딩 교실",
  category: "education" as const,
  audiences: ["youth"],
  eventStartAt: "2026-08-10T10:00:00+09:00",
  eventEndAt: null,
  applicationEndAt: "2026-08-08T18:00:00+09:00",
};

describe("mobile Supabase configuration", () => {
  it("stays local-only when either public value is absent or unsafe", () => {
    expect(readMobileSupabaseConfig(undefined, undefined)).toBeNull();
    expect(readMobileSupabaseConfig("https://example.supabase.co", "")).toBeNull();
    expect(readMobileSupabaseConfig(
      "javascript:alert(1)",
      "sb_publishable_public-key",
    )).toBeNull();
    expect(readMobileSupabaseConfig(
      "http://example.supabase.co",
      "sb_publishable_public-key",
    )).toBeNull();
    expect(readMobileSupabaseConfig(
      "https://example.supabase.co",
      "sb_secret_server-key",
    )).toBeNull();
    expect(readMobileSupabaseConfig(
      "https://example.supabase.co",
      "legacy-service-role-jwt",
    )).toBeNull();
  });

  it("normalizes a valid public project origin without retaining paths", () => {
    expect(readMobileSupabaseConfig(
      "https://example.supabase.co/rest/v1",
      "  sb_publishable_public-key  ",
    )).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_public-key",
    });
  });

  it("allows plain HTTP only for simulator and loopback development hosts", () => {
    expect(readMobileSupabaseConfig(
      "http://10.0.2.2:54321/rest/v1",
      "sb_publishable_local-key",
    )).toEqual({
      url: "http://10.0.2.2:54321",
      publishableKey: "sb_publishable_local-key",
    });
    expect(readMobileSupabaseConfig(
      "http://192.168.0.10:54321",
      "sb_publishable_local-key",
    )).toBeNull();
  });
});

describe("anonymous session", () => {
  it("reuses a stored session without creating another anonymous user", async () => {
    const signInAnonymously = vi.fn();
    const auth = {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: userId } } },
        error: null,
      }),
      signInAnonymously,
    };

    await expect(ensureAnonymousUser(auth)).resolves.toBe(userId);
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("creates an anonymous user only when no stored session exists", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInAnonymously: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    };

    await expect(ensureAnonymousUser(auth)).resolves.toBe(userId);
    expect(auth.signInAnonymously).toHaveBeenCalledOnce();
  });
});

describe("local-to-server sync policy", () => {
  it("maps only owner-scoped preferences and event ids", () => {
    let state = createDefaultLocalAppState();
    state = toggleCategory(state, "education");
    state = toggleAudience(state, "youth");
    state = setNotificationPreference(state, "newEvents", true);
    state = saveEvent(state, event, "2026-07-26T01:00:00.000Z");

    expect(buildMobileSyncSnapshot(userId, state)).toEqual({
      notificationPreference: {
        user_id: userId,
        categories: ["education"],
        audiences: ["youth"],
        new_events_enabled: true,
        closing_soon_enabled: false,
      },
      savedEvents: [{
        user_id: userId,
        event_id: event.id,
      }],
    });
  });

  it("removes only remote rows no longer present on the device", () => {
    expect(findStaleRemoteEventIds(
      ["event-a", "event-b", "event-b"],
      ["event-b", "event-c"],
    )).toEqual(["event-a"]);
  });
});
