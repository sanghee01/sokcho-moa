"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadNaverMaps,
  subscribeNaverMapAuthFailure,
  type NaverMapInstance,
  type NaverMarkerInstance,
} from "@/lib/naver-map-sdk";

type EventLocationMapProps = {
  latitude: number;
  longitude: number;
  locationName: string;
  address: string | null;
};

export function EventLocationMap({ latitude, longitude, locationName, address }: EventLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const requestKey = JSON.stringify([clientId, latitude, longitude, locationName]);
  const [statusState, setStatusState] = useState<{
    requestKey: string;
    status: "loading" | "ready" | "failed";
  }>({ requestKey, status: "loading" });
  const status = statusState.requestKey === requestKey ? statusState.status : "loading";

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      setStatusState({ requestKey, status: "failed" });
      return;
    }

    let cancelled = false;
    let failed = false;
    let mapInstance: NaverMapInstance | null = null;
    let markerInstance: NaverMarkerInstance | null = null;
    let removeTilesLoadedListener: (() => void) | null = null;

    const destroyMap = () => {
      const removeTilesListener = removeTilesLoadedListener;
      const marker = markerInstance;
      const map = mapInstance;
      removeTilesLoadedListener = null;
      markerInstance = null;
      mapInstance = null;

      try {
        removeTilesListener?.();
      } catch {}
      try {
        marker?.setMap(null);
      } catch {}
      try {
        map?.destroy();
      } catch {}
    };

    const showFallback = () => {
      if (cancelled || failed) return;
      failed = true;
      window.clearTimeout(deadline);
      try {
        destroyMap();
      } finally {
        setStatusState({ requestKey, status: "failed" });
      }
    };

    const unsubscribeAuthFailure = subscribeNaverMapAuthFailure(showFallback);
    const deadline = window.setTimeout(showFallback, 8_000);
    loadNaverMaps(clientId)
      .then((maps) => {
        if (cancelled || failed || !containerRef.current) return;
        const center = new maps.LatLng(latitude, longitude);
        mapInstance = new maps.Map(containerRef.current, {
          center,
          zoom: 16,
          draggable: false,
          pinchZoom: false,
          scrollWheel: false,
          keyboardShortcuts: false,
          disableDoubleClickZoom: true,
          disableDoubleTapZoom: true,
          disableTwoFingerTapZoom: true,
        });
        if (cancelled || failed) {
          destroyMap();
          return;
        }
        markerInstance = new maps.Marker({ map: mapInstance, position: center, title: locationName });
        const tilesLoadedListener = maps.Event.once(mapInstance, "tilesloaded", () => {
          removeTilesLoadedListener = null;
          if (cancelled || failed) return;
          window.clearTimeout(deadline);
          setStatusState({ requestKey, status: "ready" });
        });
        removeTilesLoadedListener = () => maps.Event.removeListener(tilesLoadedListener);
      })
      .catch(showFallback);

    return () => {
      cancelled = true;
      window.clearTimeout(deadline);
      destroyMap();
      unsubscribeAuthFailure();
    };
  }, [clientId, latitude, longitude, locationName, requestKey]);

  const label = `${locationName} 위치 지도${address ? `, ${address}` : ""}`;

  return (
    <div className="relative mt-6 h-72 overflow-hidden rounded-2xl bg-teal-950/60">
      <div role="img" aria-label={label} aria-hidden={status === "failed"} className="pointer-events-none h-full w-full touch-pan-y">
        <div ref={containerRef} aria-hidden="true" inert className={`h-full w-full ${status === "ready" ? "" : "invisible"}`} />
      </div>
      {status === "loading" && (
        <p role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-cyan-50">
          지도를 불러오는 중입니다.
        </p>
      )}
      {status === "failed" && (
        <div role="status" aria-label={`${label}를 표시하지 못했습니다.`} className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm leading-6 text-cyan-50">
          <p>지도를 불러오지 못했습니다.<br />아래 길찾기 링크에서 위치를 확인해 주세요.</p>
        </div>
      )}
    </div>
  );
}
