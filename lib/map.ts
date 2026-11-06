// 지도 계산과 네이버 지도 링크. 행사(주변 명소, 지도 버튼)와 명소 카드가 함께 쓰므로 도메인 밖에 둔다.
// 예전에는 features/events/model/location.ts에 있어 places가 events를 import했다(2026-11-06 옮김).

const EARTH_RADIUS_KM = 6_371;

/** 두 좌표 사이의 직선 거리(km, haversine) */
export function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  function toRadians(degree: number) {
    return (degree * Math.PI) / 180;
  }
  const latDelta = toRadians(lat2 - lat1);
  const lonDelta = toRadians(lon2 - lon1);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lonDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** 지도 검색에 쓸 장소 이름. "○○문화회관 대공연장", "○○도서관 2층"처럼 지도에 따로 없는 세부 공간명을 뗀다. */
export function createMapSearchName(name: string) {
  const trimmedName = name.trim();
  const detailSuffixes = [
    /(?:\s+|\(|\[)\s*(?:(?:지하\s*)?\d+\s*층|b\s*\d+(?:\s*층)?)(?:\s*.*)?$/iu,
    /\s+(?:대공연장|소공연장|대회의실|소회의실|시청각실|다목적실|회의실|강의실|세미나실|교육실|체험실|열람실|전시실|연습실|강당|야외무대|야외테라스)(?:\s*.*)?$/u,
    /\s+(?:본관|신관|별관)$/u,
    /\s+일원$/u,
    /\s*\([^)]*(?:시|군|구|읍|면|동|리)\)\s*$/u,
  ];

  const searchName = detailSuffixes.reduce((value, suffix) => {
    const match = value.match(suffix);
    if (match?.index == null || match.index === 0) return value;
    return value.slice(0, match.index).trim();
  }, trimmedName);

  return searchName || trimmedName;
}

export function createNaverMapUrl(name: string, latitude: number, longitude: number) {
  const query = encodeURIComponent(createMapSearchName(name));
  return `https://map.naver.com/p/search/${query}?c=${longitude},${latitude},15,0,0,0,dh`;
}
