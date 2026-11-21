import { describe, expect, it } from "vitest";
import { selectMapLabelIds, type MapLabelCandidate } from "@/features/events/model/map-label-layout";

// 마커 몸통은 44px 동그라미, 이름을 붙이면 기준점 가운데로 넓어지는 알약이다(.ai/DESIGN.md 지도).
function candidate(id: string, x: number, y: number, labelWidth: number, priority = 1): MapLabelCandidate {
  return { id, anchor: { x, y }, labelWidth, priority };
}

describe("지도 장소 이름 배치", () => {
  it("서로 멀리 떨어진 장소는 이름을 모두 보인다", () => {
    const ids = selectMapLabelIds([candidate("a", 100, 100, 120), candidate("b", 400, 100, 120)], null);
    expect([...ids].sort()).toEqual(["a", "b"]);
  });

  it("이름끼리 겹치면 행사가 많은 장소의 이름만 보인다", () => {
    // 몸통끼리는 떨어져 있고 이름 알약만 x 130~150에서 겹친다.
    const ids = selectMapLabelIds([candidate("few", 100, 100, 100, 1), candidate("many", 210, 110, 160, 5)], null);
    expect([...ids]).toEqual(["many"]);
  });

  it("이름이 다른 장소의 몸통(개수 동그라미)을 덮으면 그 이름은 숨긴다", () => {
    // a의 이름 알약(가로 200)은 x 0~200을 덮고, b의 몸통은 x 148~192에 있다.
    const ids = selectMapLabelIds([candidate("a", 100, 100, 200, 9), candidate("b", 170, 100, 40, 1)], null);
    expect(ids.has("a")).toBe(false);
    expect(ids.has("b")).toBe(true);
  });

  it("고른 장소의 이름은 겹쳐도 늘 보이고, 다른 이름보다 먼저 자리를 잡는다", () => {
    const ids = selectMapLabelIds([candidate("many", 100, 100, 100, 9), candidate("selected", 210, 110, 160, 1)], "selected");
    expect([...ids]).toEqual(["selected"]);
  });

  it("행사 수가 같으면 주어진 순서(북쪽 먼저)대로 자리를 잡는다", () => {
    const ids = selectMapLabelIds([candidate("north", 100, 100, 100, 2), candidate("south", 210, 110, 160, 2)], null);
    expect([...ids]).toEqual(["north"]);
  });
});
