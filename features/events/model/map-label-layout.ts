// 지도 탭(/map)의 마커 배치: 겹치는 마커 묶기와 장소 이름을 어느 핀에 보일지 정한다(.ai/DESIGN.md 지도).
// 마커는 늘 보이는 "위치 점 + 행사 개수 동그라미"이고, 장소 이름은 다른 마커와 겹치지 않을 때만 붙인다.
// 포스터 핀이 시내에 몰려 서로 가렸던 문제(2026-11-21 사용자 피드백)를 지도 서비스의 겹침 관리 방식으로 푼다:
// 겹치면 우선순위가 낮은 이름을 숨긴다(Google Maps marker collision behavior "OPTIONAL_AND_HIDES_LOWER_PRIORITY").

/** 마커 몸통 지름. 누를 수 있는 요소의 최소 크기(44px, .ai/DESIGN.md)에 맞춘다. 이름을 붙이면 같은 높이의 알약으로 넓어진다. */
export const MAP_MARKER_BODY_PX = 44;

/** 몸통 바닥에서 위치 점 가운데(장소 좌표)까지. 마커 컴포넌트의 꼬리·점 class와 맞춘 값이다(map-marker-icon.ts). */
export const MAP_MARKER_TAIL_TIP_PX = 5;

export interface MapLabelCandidate {
  id: string;
  /** 장소 좌표의 화면 위치(px). 마커는 이 점 위에 그려진다. */
  anchor: { x: number; y: number };
  /** 이름을 붙였을 때 알약 전체 폭(px). 몸통 지름보다 작으면 몸통 지름으로 본다. */
  labelWidth: number;
  /** 클수록 먼저 자리를 잡는다. 행사 수를 넘긴다. */
  priority: number;
}

export interface MapMarkerPoint {
  id: string;
  anchor: { x: number; y: number };
  priority: number;
}

export interface MapMarkerCluster {
  /** 묶음을 그릴 자리의 마커(행사가 가장 많은 마커). 묶음이 아니면 그 마커 자신이다. */
  representativeId: string;
  /** 대표가 맨 앞이고 나머지는 주어진 순서 */
  memberIds: string[];
}

/**
 * 몸통이 겹치는 마커를 하나로 묶는다(지도 서비스의 마커 묶기, Google Maps Marker Clustering).
 * 시내 전체를 볼 때 문화예술회관·엑스포 일대처럼 시설이 몰린 곳의 개수 동그라미끼리 겹쳐 읽고 누르기 어려웠다(2026-11-21 사용자 피드백).
 * 고른 장소 → 행사가 많은 마커 순서로 대표가 되어, 아직 묶이지 않은 마커 중 몸통이 겹치는 것을 끌어온다. 고른 장소는 묶지 않는다.
 */
export function clusterMapMarkers(points: readonly MapMarkerPoint[], selectedId: string | null): MapMarkerCluster[] {
  const ordered = orderByPriority(points, selectedId);
  const assigned = new Set<string>();
  const clusters: MapMarkerCluster[] = [];
  for (const point of ordered) {
    if (assigned.has(point.id)) continue;
    assigned.add(point.id);
    const body = markerBox(point.anchor, MAP_MARKER_BODY_PX);
    const others = point.id === selectedId
      ? []
      : points.filter((other) =>
        !assigned.has(other.id) && other.id !== selectedId && overlaps(body, markerBox(other.anchor, MAP_MARKER_BODY_PX)));
    for (const other of others) assigned.add(other.id);
    clusters.push({ representativeId: point.id, memberIds: [point.id, ...others.map((other) => other.id)] });
  }
  return clusters;
}

/** 고른 장소가 먼저, 그다음 행사가 많은 순서, 같으면 주어진 순서(북쪽 먼저) */
function orderByPriority<T extends { id: string; priority: number }>(items: readonly T[], selectedId: string | null) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) =>
      Number(b.item.id === selectedId) - Number(a.item.id === selectedId)
      || b.item.priority - a.item.priority
      || a.index - b.index)
    .map(({ item }) => item);
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * 이름을 보일 핀 id. 고른 장소가 먼저, 그다음 행사가 많은 장소부터 자리를 잡고(같으면 주어진 순서),
 * 이미 자리 잡은 이름이나 다른 핀의 몸통과 겹치는 이름은 숨긴다. 고른 장소의 이름은 겹쳐도 늘 보인다.
 * 몸통은 이름과 상관없이 늘 보이므로, 이름이 다른 핀의 개수를 덮지 않게 몸통도 장애물로 본다.
 */
export function selectMapLabelIds(candidates: readonly MapLabelCandidate[], selectedId: string | null): Set<string> {
  const bodies = new Map(candidates.map((candidate) => [candidate.id, markerBox(candidate.anchor, MAP_MARKER_BODY_PX)]));
  const ordered = orderByPriority(candidates, selectedId);

  const placed: Box[] = [];
  const shownIds = new Set<string>();
  for (const candidate of ordered) {
    const label = markerBox(candidate.anchor, Math.max(candidate.labelWidth, MAP_MARKER_BODY_PX));
    const isSelected = candidate.id === selectedId;
    const hitsLabel = placed.some((box) => overlaps(box, label));
    const hitsBody = [...bodies].some(([id, body]) => id !== candidate.id && overlaps(body, label));
    if (!isSelected && (hitsLabel || hitsBody)) continue;
    placed.push(label);
    shownIds.add(candidate.id);
  }
  return shownIds;
}

/** 기준점 위에 가운데 정렬로 그려지는 마커 몸통(또는 이름 알약)의 화면 상자 */
function markerBox(anchor: { x: number; y: number }, width: number): Box {
  const bottom = anchor.y - MAP_MARKER_TAIL_TIP_PX;
  return { left: anchor.x - width / 2, right: anchor.x + width / 2, top: bottom - MAP_MARKER_BODY_PX, bottom };
}

/** 모서리만 닿는 것은 겹침으로 보지 않는다. */
function overlaps(a: Box, b: Box) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}
