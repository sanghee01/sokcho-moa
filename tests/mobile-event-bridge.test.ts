import { describe, expect, it } from "vitest";
import {
  createSaveEventMessage,
  parseMobileEventMessage,
  type MobileEventSummary,
} from "@/lib/mobile/event-bridge";

const event: MobileEventSummary = {
  slug: "summer-family-festival",
  title: "여름 가족 축제",
  category: "festival",
  audiences: ["family", "all"],
  eventStartAt: "2026-08-01T00:00:00+09:00",
  eventEndAt: "2026-08-03T23:59:59+09:00",
  applicationEndAt: null,
};

describe("mobile event bridge", () => {
  it("round-trips the versioned save-event contract", () => {
    expect(parseMobileEventMessage(createSaveEventMessage(event))).toEqual({
      version: 1,
      type: "save_event",
      event,
    });
  });

  it.each([
    "",
    "not-json",
    JSON.stringify({ version: 2, type: "save_event", event }),
    JSON.stringify({ version: 1, type: "remove_event", event }),
    JSON.stringify({
      version: 1,
      type: "save_event",
      event: { ...event, slug: "../admin" },
    }),
    JSON.stringify({
      version: 1,
      type: "save_event",
      event: { ...event, category: "unknown" },
    }),
    JSON.stringify({
      version: 1,
      type: "save_event",
      event: { ...event, eventStartAt: "not-a-date" },
    }),
  ])("rejects malformed or unsupported messages", (raw) => {
    expect(parseMobileEventMessage(raw)).toBeNull();
  });

  it("rejects oversized messages before parsing", () => {
    expect(parseMobileEventMessage("x".repeat(8_193))).toBeNull();
  });
});
