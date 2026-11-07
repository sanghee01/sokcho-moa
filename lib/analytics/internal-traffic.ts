/**
 * 운영자 기기 표시. 관리자 화면에 들어간 기기는 GA 이벤트에 traffic_type을 붙이고,
 * GA 데이터 필터 "Internal Traffic"이 이 값으로 운영자 방문을 뺀다(2026-11-07).
 * 휴대폰은 IP가 계속 바뀌어 GA의 IP 규칙만으로는 운영자를 가릴 수 없다.
 * 앱 레이아웃의 GA 대기열 스크립트가 이 키를 읽어, 다음 방문부터는 page_view보다 먼저 표시를 붙인다.
 */
export const INTERNAL_TRAFFIC_STORAGE_KEY = "sokchomoa:ga-internal-traffic";

/** GA 내부 트래픽 정의의 기본값. 데이터 필터가 이 값을 찾는다. */
export const INTERNAL_TRAFFIC_TYPE = "internal";

export function markInternalTraffic() {
  try {
    window.localStorage.setItem(INTERNAL_TRAFFIC_STORAGE_KEY, "1");
  } catch {
    // 저장소를 막은 브라우저에서는 기억하지 못하고, 지금 화면에만 표시한다.
  }
  window.gtag?.("set", { traffic_type: INTERNAL_TRAFFIC_TYPE });
}
