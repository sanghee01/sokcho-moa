"use client";

import { useState, useSyncExternalStore } from "react";
import {
  createSaveEventMessage,
  type MobileEventSummary,
} from "@/lib/mobile/event-bridge";

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage(message: string): void;
    };
  }
}

type SaveStatus = "idle" | "sent";

const subscribeToBridge = () => () => undefined;
const getServerBridgeSnapshot = () => false;
const getBridgeSnapshot = () => (
  typeof window.ReactNativeWebView?.postMessage === "function"
);

export function SaveEventButton({ event }: { event: MobileEventSummary }) {
  const isInsideApp = useSyncExternalStore(
    subscribeToBridge,
    getBridgeSnapshot,
    getServerBridgeSnapshot,
  );
  const [status, setStatus] = useState<SaveStatus>("idle");

  if (!isInsideApp) return null;

  function handleSave() {
    const bridge = window.ReactNativeWebView;
    if (!bridge) return;
    bridge.postMessage(createSaveEventMessage(event));
    setStatus("sent");
  }

  return (
    <div className="relative self-start pb-6">
      <button
        type="button"
        onClick={handleSave}
        className="min-h-12 rounded-2xl border border-rose-600 bg-white px-5 py-3 font-bold text-rose-700 transition hover:bg-rose-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
      >
        {status === "sent" ? "관심 행사 저장됨" : "관심 행사 저장"}
      </button>
      {status === "sent" && (
        <div
          role="status"
          aria-live="polite"
          className="absolute left-1/2 top-12 mt-1 -translate-x-1/2 whitespace-nowrap text-sm font-black text-teal-700"
        >
          앱의 저장 행사에서 확인하세요.
        </div>
      )}
    </div>
  );
}
