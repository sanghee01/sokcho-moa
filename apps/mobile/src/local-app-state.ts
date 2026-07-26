import {
  isMobileEventSummary,
  mobileEventAudiences,
  mobileEventCategories,
  type MobileEventSummary,
} from "../../../lib/mobile/event-bridge";

export type MobileEventCategory = (typeof mobileEventCategories)[number];
export type MobileEventAudience = (typeof mobileEventAudiences)[number];

export type NotificationPreferences = {
  newEvents: boolean;
  closingSoon: boolean;
};

export type SavedEvent = MobileEventSummary & {
  savedAt: string;
};

export type LocalAppState = {
  version: 1;
  categories: MobileEventCategory[];
  audiences: MobileEventAudience[];
  notifications: NotificationPreferences;
  savedEvents: SavedEvent[];
};

const MAX_SAVED_EVENTS = 100;
const categorySet = new Set<string>(mobileEventCategories);
const audienceSet = new Set<string>(mobileEventAudiences);

export function createDefaultLocalAppState(): LocalAppState {
  return {
    version: 1,
    categories: [],
    audiences: [],
    notifications: {
      newEvents: false,
      closingSoon: false,
    },
    savedEvents: [],
  };
}

export function readLocalAppState(raw: string | null): LocalAppState {
  if (!raw) return createDefaultLocalAppState();

  try {
    return normalizeLocalAppState(JSON.parse(raw));
  } catch {
    return createDefaultLocalAppState();
  }
}

export function normalizeLocalAppState(value: unknown): LocalAppState {
  if (!isRecord(value) || value.version !== 1) {
    return createDefaultLocalAppState();
  }

  return {
    version: 1,
    categories: readUniqueStrings(value.categories, categorySet) as MobileEventCategory[],
    audiences: readUniqueStrings(value.audiences, audienceSet) as MobileEventAudience[],
    notifications: normalizeNotifications(value.notifications),
    savedEvents: normalizeSavedEvents(value.savedEvents),
  };
}

export function toggleCategory(
  state: LocalAppState,
  category: MobileEventCategory,
): LocalAppState {
  return {
    ...state,
    categories: toggleSelection(state.categories, category),
  };
}

export function toggleAudience(
  state: LocalAppState,
  audience: MobileEventAudience,
): LocalAppState {
  return {
    ...state,
    audiences: toggleSelection(state.audiences, audience),
  };
}

export function setNotificationPreference(
  state: LocalAppState,
  preference: keyof NotificationPreferences,
  enabled: boolean,
): LocalAppState {
  return {
    ...state,
    notifications: {
      ...state.notifications,
      [preference]: enabled,
    },
  };
}

export function saveEvent(
  state: LocalAppState,
  event: MobileEventSummary,
  savedAt = new Date().toISOString(),
): LocalAppState {
  const otherEvents = state.savedEvents.filter((savedEvent) => savedEvent.slug !== event.slug);
  return {
    ...state,
    savedEvents: [{ ...event, savedAt }, ...otherEvents].slice(0, MAX_SAVED_EVENTS),
  };
}

export function removeSavedEvent(state: LocalAppState, slug: string): LocalAppState {
  return {
    ...state,
    savedEvents: state.savedEvents.filter((event) => event.slug !== slug),
  };
}

function normalizeNotifications(value: unknown): NotificationPreferences {
  if (!isRecord(value)) return createDefaultLocalAppState().notifications;
  return {
    newEvents: value.newEvents === true,
    closingSoon: value.closingSoon === true,
  };
}

function normalizeSavedEvents(value: unknown): SavedEvent[] {
  if (!Array.isArray(value)) return [];

  const seenSlugs = new Set<string>();
  const savedEvents: SavedEvent[] = [];

  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    const savedAt = candidate.savedAt;
    if (
      savedEvents.length >= MAX_SAVED_EVENTS
      || !isMobileEventSummary(candidate)
      || typeof savedAt !== "string"
      || Number.isNaN(Date.parse(savedAt))
      || seenSlugs.has(candidate.slug)
    ) {
      continue;
    }

    seenSlugs.add(candidate.slug);
    savedEvents.push({ ...candidate, savedAt });
  }

  return savedEvents;
}

function readUniqueStrings(value: unknown, allowedValues: Set<string>) {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value.filter((item): item is string => (
      typeof item === "string" && allowedValues.has(item)
    )),
  )];
}

function toggleSelection<T extends string>(selected: readonly T[], value: T): T[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
