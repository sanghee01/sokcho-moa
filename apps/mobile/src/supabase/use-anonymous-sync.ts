import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { LocalAppState } from "../local-app-state";
import {
  ensureAnonymousUser,
  syncLocalAppState,
} from "./anonymous-sync";
import { getMobileSupabaseClient } from "./mobile-supabase";

export type AnonymousSyncStatus =
  | "local_only"
  | "connecting"
  | "syncing"
  | "synced"
  | "error";

export function useAnonymousSync(
  state: LocalAppState,
  isLocalStateLoading: boolean,
) {
  const client = useMemo(getMobileSupabaseClient, []);
  const [status, setStatus] = useState<AnonymousSyncStatus>(
    client ? "connecting" : "local_only",
  );
  const userId = useRef<string | null>(null);
  const syncQueue = useRef<Promise<void>>(Promise.resolve());
  const revision = useRef(0);

  useEffect(() => {
    if (!client) return;

    function updateAutoRefresh(appState: AppStateStatus) {
      if (appState === "active") client?.auth.startAutoRefresh();
      else client?.auth.stopAutoRefresh();
    }

    updateAutoRefresh(AppState.currentState);
    const subscription = AppState.addEventListener("change", updateAutoRefresh);
    return () => {
      subscription.remove();
      client.auth.stopAutoRefresh();
    };
  }, [client]);

  useEffect(() => {
    if (!client || isLocalStateLoading) return;

    let shouldReportResult = true;
    const currentRevision = revision.current + 1;
    revision.current = currentRevision;
    setStatus(userId.current ? "syncing" : "connecting");

    syncQueue.current = syncQueue.current
      .catch(() => undefined)
      .then(async () => {
        const currentUserId = userId.current ?? await ensureAnonymousUser({
          getSession: () => client.auth.getSession(),
          signInAnonymously: () => client.auth.signInAnonymously(),
        });
        userId.current = currentUserId;
        await syncLocalAppState(client, currentUserId, state);
      })
      .then(() => {
        if (shouldReportResult && revision.current === currentRevision) {
          setStatus("synced");
        }
      })
      .catch(() => {
        if (shouldReportResult && revision.current === currentRevision) {
          setStatus("error");
        }
      });

    return () => {
      shouldReportResult = false;
    };
  }, [client, isLocalStateLoading, state]);

  return status;
}
