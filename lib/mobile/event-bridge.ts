import type { Event, EventAudience, EventCategory } from "../domain/event";

export const MOBILE_EVENT_BRIDGE_VERSION = 1 as const;
export const mobileEventCategories = [
  "performance",
  "festival",
  "experience",
  "education",
  "exhibition",
  "other",
] as const satisfies readonly EventCategory[];
export const mobileEventAudiences = [
  "child",
  "youth",
  "family",
  "adult",
  "all",
] as const satisfies readonly EventAudience[];

export type MobileEventSummary = Pick<
  Event,
  | "slug"
  | "title"
  | "category"
  | "audiences"
  | "eventStartAt"
  | "eventEndAt"
  | "applicationEndAt"
>;

export type SaveEventMessage = {
  version: typeof MOBILE_EVENT_BRIDGE_VERSION;
  type: "save_event";
  event: MobileEventSummary;
};

const MAX_MESSAGE_LENGTH = 8_192;
const MAX_SLUG_LENGTH = 160;
const MAX_TITLE_LENGTH = 200;
const categorySet = new Set<string>(mobileEventCategories);
const audienceSet = new Set<string>(mobileEventAudiences);

export function createSaveEventMessage(event: MobileEventSummary) {
  return JSON.stringify({
    version: MOBILE_EVENT_BRIDGE_VERSION,
    type: "save_event",
    event,
  } satisfies SaveEventMessage);
}

export function parseMobileEventMessage(raw: unknown): SaveEventMessage | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_MESSAGE_LENGTH) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return null;
    if (value.version !== MOBILE_EVENT_BRIDGE_VERSION || value.type !== "save_event") {
      return null;
    }
    if (!isMobileEventSummary(value.event)) return null;

    return {
      version: MOBILE_EVENT_BRIDGE_VERSION,
      type: "save_event",
      event: value.event,
    };
  } catch {
    return null;
  }
}

export function isMobileEventSummary(value: unknown): value is MobileEventSummary {
  if (!isRecord(value)) return false;
  if (!isSafeSlug(value.slug) || !isBoundedText(value.title, MAX_TITLE_LENGTH)) {
    return false;
  }
  if (typeof value.category !== "string" || !categorySet.has(value.category)) {
    return false;
  }
  if (
    !Array.isArray(value.audiences)
    || value.audiences.length > mobileEventAudiences.length
    || !value.audiences.every(
      (audience) => typeof audience === "string" && audienceSet.has(audience),
    )
  ) {
    return false;
  }

  return isIsoDate(value.eventStartAt)
    && isNullableIsoDate(value.eventEndAt)
    && isNullableIsoDate(value.applicationEndAt);
}

function isSafeSlug(value: unknown) {
  return typeof value === "string"
    && value.length > 0
    && value.length <= MAX_SLUG_LENGTH
    && value.trim() === value
    && !/[/?#\\]/.test(value);
}

function isBoundedText(value: unknown, maxLength: number) {
  return typeof value === "string"
    && value.trim().length > 0
    && value.length <= maxLength;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string"
    && value.length <= 40
    && !Number.isNaN(Date.parse(value));
}

function isNullableIsoDate(value: unknown): value is string | null {
  return value === null || isIsoDate(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
