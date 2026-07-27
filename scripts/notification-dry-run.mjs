import {
  createNotificationCandidates,
  isDryRun,
} from "../supabase/functions/_shared/notification-policy.ts";

const now = new Date("2026-07-26T00:00:00.000Z");
const events = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "summer-family-festival",
    title: "여름 가족 축제",
    category: "festival",
    audiences: ["family"],
    reviewStatus: "published",
    publishedAt: "2026-07-25T23:00:00.000Z",
    applicationEndAt: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    slug: "youth-coding-class",
    title: "청소년 코딩 교실",
    category: "education",
    audiences: ["youth"],
    reviewStatus: "published",
    publishedAt: "2026-07-20T00:00:00.000Z",
    applicationEndAt: "2026-07-27T00:00:00.000Z",
  },
];
const preferences = [{
  userId: "20000000-0000-4000-8000-000000000001",
  categories: ["festival"],
  audiences: ["family"],
  newEventsEnabled: true,
  closingSoonEnabled: true,
}];
const savedEvents = [{
  userId: "20000000-0000-4000-8000-000000000001",
  eventId: "10000000-0000-4000-8000-000000000002",
}];

if (!isDryRun(undefined)) {
  throw new Error("Missing DRY_RUN must never enable live delivery.");
}

const candidates = createNotificationCandidates({
  events,
  preferences,
  savedEvents,
  now,
});

console.log(JSON.stringify({
  mode: "DRY_RUN",
  networkRequests: 0,
  candidateCount: candidates.length,
  candidates,
}, null, 2));
