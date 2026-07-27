import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocalAppState } from "../local-app-state";

type AuthError = { message: string } | null;

export type AnonymousAuthGateway = {
  getSession(): Promise<{
    data: { session: { user: { id: string } } | null };
    error: AuthError;
  }>;
  signInAnonymously(): Promise<{
    data: { user: { id: string } | null };
    error: AuthError;
  }>;
};

export type MobileSyncSnapshot = {
  notificationPreference: {
    user_id: string;
    categories: LocalAppState["categories"];
    audiences: LocalAppState["audiences"];
    new_events_enabled: boolean;
    closing_soon_enabled: boolean;
  };
  savedEvents: {
    user_id: string;
    event_id: string;
  }[];
};

export function buildMobileSyncSnapshot(
  userId: string,
  state: LocalAppState,
): MobileSyncSnapshot {
  return {
    notificationPreference: {
      user_id: userId,
      categories: state.categories,
      audiences: state.audiences,
      new_events_enabled: state.notifications.newEvents,
      closing_soon_enabled: state.notifications.closingSoon,
    },
    savedEvents: state.savedEvents.map((event) => ({
      user_id: userId,
      event_id: event.id,
    })),
  };
}

export function findStaleRemoteEventIds(
  remoteEventIds: readonly string[],
  localEventIds: readonly string[],
) {
  const localIds = new Set(localEventIds);
  return [...new Set(remoteEventIds)].filter((eventId) => !localIds.has(eventId));
}

export async function ensureAnonymousUser(auth: AnonymousAuthGateway) {
  const sessionResult = await auth.getSession();
  if (sessionResult.error) throw new Error(sessionResult.error.message);
  if (sessionResult.data.session) return sessionResult.data.session.user.id;

  const signInResult = await auth.signInAnonymously();
  if (signInResult.error) throw new Error(signInResult.error.message);
  if (!signInResult.data.user) throw new Error("익명 사용자 세션을 만들지 못했습니다.");
  return signInResult.data.user.id;
}

export async function syncLocalAppState(
  client: SupabaseClient,
  userId: string,
  state: LocalAppState,
) {
  const snapshot = buildMobileSyncSnapshot(userId, state);

  const preferenceResult = await client
    .from("notification_preferences")
    .upsert(snapshot.notificationPreference, { onConflict: "user_id" });
  throwOnSupabaseError(preferenceResult.error, "관심 설정 동기화");

  if (snapshot.savedEvents.length > 0) {
    const savedResult = await client
      .from("saved_events")
      .upsert(snapshot.savedEvents, {
        onConflict: "user_id,event_id",
        ignoreDuplicates: true,
      });
    throwOnSupabaseError(savedResult.error, "저장 행사 동기화");
  }

  const remoteResult = await client
    .from("saved_events")
    .select("event_id")
    .eq("user_id", userId);
  throwOnSupabaseError(remoteResult.error, "저장 행사 확인");

  const remoteRows = (remoteResult.data ?? []) as { event_id: string }[];
  const staleEventIds = findStaleRemoteEventIds(
    remoteRows.map((row) => row.event_id),
    snapshot.savedEvents.map((row) => row.event_id),
  );
  if (staleEventIds.length === 0) return;

  const deleteResult = await client
    .from("saved_events")
    .delete()
    .eq("user_id", userId)
    .in("event_id", staleEventIds);
  throwOnSupabaseError(deleteResult.error, "저장 행사 정리");
}

function throwOnSupabaseError(
  error: { message: string } | null,
  operation: string,
) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}
