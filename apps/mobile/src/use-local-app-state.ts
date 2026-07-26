import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDefaultLocalAppState,
  type LocalAppState,
} from "./local-app-state";
import {
  loadLocalAppState,
  persistLocalAppState,
} from "./local-app-storage";

type LoadStatus = "loading" | "ready";
export type PersistenceStatus = "idle" | "saving" | "saved" | "error";

export function useLocalAppState() {
  const [state, setState] = useState(createDefaultLocalAppState);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>("idle");
  const latestState = useRef(state);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const revision = useRef(0);

  useEffect(() => {
    let isCurrent = true;

    loadLocalAppState()
      .then((storedState) => {
        if (!isCurrent) return;
        latestState.current = storedState;
        setState(storedState);
        setLoadStatus("ready");
      })
      .catch(() => {
        if (!isCurrent) return;
        setPersistenceStatus("error");
        setLoadStatus("ready");
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const updateState = useCallback((update: (current: LocalAppState) => LocalAppState) => {
    const nextState = update(latestState.current);
    const nextRevision = revision.current + 1;
    revision.current = nextRevision;
    latestState.current = nextState;
    setState(nextState);
    setPersistenceStatus("saving");

    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(() => persistLocalAppState(nextState))
      .then(() => {
        if (revision.current === nextRevision) setPersistenceStatus("saved");
      })
      .catch(() => {
        if (revision.current === nextRevision) setPersistenceStatus("error");
      });
  }, []);

  return {
    state,
    isLoading: loadStatus === "loading",
    persistenceStatus,
    updateState,
  };
}
