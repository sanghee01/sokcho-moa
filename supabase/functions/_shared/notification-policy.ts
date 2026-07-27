export type NotificationKind = "new_event" | "closing_soon";

export type NotificationEvent = {
  id: string;
  slug: string;
  title: string;
  category: string;
  audiences: string[];
  reviewStatus: "published" | "pending" | "rejected";
  publishedAt: string | null;
  applicationEndAt: string | null;
};

export type NotificationPreference = {
  userId: string;
  categories: string[];
  audiences: string[];
  newEventsEnabled: boolean;
  closingSoonEnabled: boolean;
};

export type SavedEventReference = {
  userId: string;
  eventId: string;
};

export type NotificationCandidate = {
  userId: string;
  eventId: string;
  kind: NotificationKind;
  dedupeKey: string;
  title: string;
  body: string;
  data: {
    eventId: string;
    eventSlug: string;
    kind: NotificationKind;
  };
  scheduledFor: string;
};

type CandidateInput = {
  events: NotificationEvent[];
  preferences: NotificationPreference[];
  savedEvents: SavedEventReference[];
  now: Date;
  newEventLookbackHours?: number;
  closingSoonHours?: number;
};

export function createNotificationCandidates({
  events,
  preferences,
  savedEvents,
  now,
  newEventLookbackHours = 48,
  closingSoonHours = 48,
}: CandidateInput) {
  const nowMs = now.getTime();
  if (Number.isNaN(nowMs)) return [];

  const newEventThreshold = nowMs - newEventLookbackHours * 60 * 60 * 1_000;
  const closingSoonThreshold = nowMs + closingSoonHours * 60 * 60 * 1_000;
  const publishedEvents = events.filter((event) => event.reviewStatus === "published");
  const eventById = new Map(publishedEvents.map((event) => [event.id, event]));
  const savedEventIdsByUser = groupSavedEventIds(savedEvents);
  const candidates: NotificationCandidate[] = [];

  for (const preference of preferences) {
    if (preference.newEventsEnabled && hasSelectedInterest(preference)) {
      for (const event of publishedEvents) {
        const publishedAt = timestamp(event.publishedAt);
        if (
          publishedAt === null
          || publishedAt < newEventThreshold
          || publishedAt > nowMs
          || !matchesInterest(event, preference)
        ) {
          continue;
        }
        candidates.push(newEventCandidate(preference.userId, event, now));
      }
    }

    if (!preference.closingSoonEnabled) continue;
    for (const eventId of savedEventIdsByUser.get(preference.userId) ?? []) {
      const event = eventById.get(eventId);
      if (!event) continue;
      const applicationEndAt = timestamp(event.applicationEndAt);
      if (
        applicationEndAt === null
        || applicationEndAt < nowMs
        || applicationEndAt > closingSoonThreshold
      ) {
        continue;
      }
      candidates.push(closingSoonCandidate(
        preference.userId,
        event,
        now,
      ));
    }
  }

  return dedupeCandidates(candidates);
}

export function isDryRun(value: string | null | undefined) {
  return value?.trim().toLowerCase() !== "false";
}

function hasSelectedInterest(preference: NotificationPreference) {
  return preference.categories.length > 0 || preference.audiences.length > 0;
}

function matchesInterest(
  event: NotificationEvent,
  preference: NotificationPreference,
) {
  const categoryMatches = preference.categories.length === 0
    || preference.categories.includes(event.category);
  const audienceMatches = preference.audiences.length === 0
    || preference.audiences.includes("all")
    || event.audiences.includes("all")
    || event.audiences.some((audience) => preference.audiences.includes(audience));
  return categoryMatches && audienceMatches;
}

function groupSavedEventIds(savedEvents: SavedEventReference[]) {
  const grouped = new Map<string, Set<string>>();
  for (const savedEvent of savedEvents) {
    const eventIds = grouped.get(savedEvent.userId) ?? new Set<string>();
    eventIds.add(savedEvent.eventId);
    grouped.set(savedEvent.userId, eventIds);
  }
  return grouped;
}

function newEventCandidate(
  userId: string,
  event: NotificationEvent,
  now: Date,
): NotificationCandidate {
  return {
    userId,
    eventId: event.id,
    kind: "new_event",
    dedupeKey: `new_event:${userId}:${event.id}`,
    title: "관심 있는 새 행사가 올라왔어요",
    body: event.title,
    data: {
      eventId: event.id,
      eventSlug: event.slug,
      kind: "new_event",
    },
    scheduledFor: now.toISOString(),
  };
}

function closingSoonCandidate(
  userId: string,
  event: NotificationEvent,
  now: Date,
): NotificationCandidate {
  return {
    userId,
    eventId: event.id,
    kind: "closing_soon",
    dedupeKey: `closing_soon:${userId}:${event.id}:${event.applicationEndAt}`,
    title: "저장한 행사의 신청 마감이 가까워요",
    body: event.title,
    data: {
      eventId: event.id,
      eventSlug: event.slug,
      kind: "closing_soon",
    },
    scheduledFor: now.toISOString(),
  };
}

function dedupeCandidates(candidates: NotificationCandidate[]) {
  const byKey = new Map<string, NotificationCandidate>();
  for (const candidate of candidates) byKey.set(candidate.dedupeKey, candidate);
  return [...byKey.values()].sort((left, right) => (
    left.dedupeKey.localeCompare(right.dedupeKey)
  ));
}

function timestamp(value: string | null) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}
