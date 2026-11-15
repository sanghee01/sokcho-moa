// 장소 사전: 자주 쓰는 시설의 이름 → 공식 주소(data/venues.json).
// 기관 공고는 "속초문화예술회관 대공연장"처럼 장소 이름만 쓰는 일이 많아, 저장된 주소가 없으면 화면을 그릴 때 사전으로 채운다.
// DB에는 쓰지 않고, 핵심 정보·지도 링크·구조화 데이터·RSS가 같은 주소를 쓰도록 이 파일 한 곳에서 정한다(2026-11-15 사용자 결정).
import { z } from "zod";
import venueCatalog from "@/data/venues.json";
import type { Event } from "@/features/events/model/event";

const venueSchema = z.object({
  name: z.string().trim().min(1),
  /** 공식 표기와 띄어쓰기 외에 다르게 쓰는 이름 */
  aliases: z.array(z.string().trim().min(1)),
  address: z.string().startsWith("강원특별자치도 "),
  /** 주소를 확인한 공식 출처 */
  sourceUrl: z.string().url(),
});

export type Venue = z.infer<typeof venueSchema>;

export const venues: Venue[] = z.object({ venues: z.array(venueSchema) }).parse(venueCatalog).venues;

// 여러 장소("A 및 B", "A / B", "A·B", "A, B")나 넓은 구역("일원", "등")은 한 시설 주소로 대신하지 않는다.
// "등대해수욕장"처럼 이름 안의 "등"은 걸리지 않게 앞뒤 공백이 있을 때만 본다.
const MULTI_PLACE_OR_AREA_PATTERN = /및|\/|·|,|일원|(?:^|\s)등(?:\s|$)/;

/** 장소 이름에 맞는 사전 시설의 주소. 시설 이름 뒤의 방·층 이름은 무시하고, 더 긴(구체적인) 시설 이름을 먼저 고른다. */
export function findVenueAddress(locationName: string | null, venueList: readonly Venue[] = venues) {
  const name = locationName?.trim();
  if (!name || MULTI_PLACE_OR_AREA_PATTERN.test(name)) return null;

  const compactLocation = compactName(name);
  const match = venueList
    .flatMap((venue) => [venue.name, ...venue.aliases].map((key) => ({ key: compactName(key), venue })))
    .filter(({ key }) => compactLocation.startsWith(key))
    .sort((a, b) => b.key.length - a.key.length)[0];
  return match?.venue.address ?? null;
}

/** 화면·구조화 데이터·RSS가 쓰는 행사 주소. 저장된 주소가 우선이고, 없으면 장소 사전에서 찾는다. */
export function resolveEventAddress(event: Pick<Event, "address" | "locationName">, venueList: readonly Venue[] = venues) {
  return event.address?.trim() || findVenueAddress(event.locationName, venueList);
}

function compactName(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
