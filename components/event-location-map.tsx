"use client";

import { useEffect, useRef, useState } from "react";

type KakaoMaps = {
  load(callback: () => void): void;
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (container: HTMLElement, options: Record<string, unknown>) => unknown;
  Marker: new (options: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

let sdkPromise: Promise<KakaoMaps> | null = null;

function loadKakaoMaps(appKey: string) {
  if (window.kakao?.maps) {
    return new Promise<KakaoMaps>((resolve) => window.kakao!.maps.load(() => resolve(window.kakao!.maps)));
  }
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error("카카오 지도 SDK를 초기화하지 못했습니다."));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };
    script.onerror = () => reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  }).catch((error) => {
    sdkPromise = null;
    throw error;
  });

  return sdkPromise;
}

type EventLocationMapProps = {
  latitude: number;
  longitude: number;
  locationName: string;
  address: string | null;
};

export function EventLocationMap({ latitude, longitude, locationName, address }: EventLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;

  useEffect(() => {
    if (!appKey || !containerRef.current) {
      setStatus("failed");
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => setStatus("failed"), 8_000);
    loadKakaoMaps(appKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const center = new maps.LatLng(latitude, longitude);
        const map = new maps.Map(containerRef.current, {
          center,
          level: 3,
          draggable: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          keyboardShortcuts: false,
        });
        new maps.Marker({ map, position: center, title: locationName });
        window.clearTimeout(timeout);
        setStatus("ready");
      })
      .catch(() => setStatus("failed"));

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [appKey, latitude, longitude, locationName]);

  const label = `${locationName} 위치 지도${address ? `, ${address}` : ""}`;

  return (
    <div className="relative mt-6 h-72 overflow-hidden rounded-2xl bg-teal-950/60">
      <div ref={containerRef} role="img" aria-label={label} aria-hidden={status === "failed"} className={`h-full w-full ${status === "failed" ? "invisible" : ""}`} />
      {status === "loading" && (
        <p role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-cyan-50">
          지도를 불러오는 중입니다.
        </p>
      )}
      {status === "failed" && (
        <div role="status" className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm leading-6 text-cyan-50">
          <p>지도를 불러오지 못했습니다.<br />아래 길찾기 링크에서 위치를 확인해 주세요.</p>
        </div>
      )}
    </div>
  );
}
