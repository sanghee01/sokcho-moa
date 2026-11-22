import { describe, expect, it } from "vitest";
import { clusterMapMarkers } from "@/features/map/model/map-label-layout";

function marker(id: string, x: number, y: number, priority = 1) {
  return { id, anchor: { x, y }, priority };
}

describe("지도 마커 묶기", () => {
  it("몸통이 겹치지 않는 마커는 하나씩 둔다", () => {
    expect(clusterMapMarkers([marker("a", 0, 0), marker("b", 100, 0)], null)).toEqual([
      { representativeId: "a", memberIds: ["a"] },
      { representativeId: "b", memberIds: ["b"] },
    ]);
  });

  it("몸통이 겹치는 마커는 행사가 많은 마커 자리로 묶는다", () => {
    expect(clusterMapMarkers([marker("few", 0, 0, 1), marker("many", 20, 10, 5), marker("far", 300, 0, 1)], null)).toEqual([
      { representativeId: "many", memberIds: ["many", "few"] },
      { representativeId: "far", memberIds: ["far"] },
    ]);
  });

  it("고른 장소는 겹쳐도 묶지 않고 따로 둔다", () => {
    expect(clusterMapMarkers([marker("selected", 0, 0, 1), marker("other", 20, 0, 5)], "selected")).toEqual([
      { representativeId: "selected", memberIds: ["selected"] },
      { representativeId: "other", memberIds: ["other"] },
    ]);
  });
});
