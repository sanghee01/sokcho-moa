import type { ReactNode } from "react";
import { CarFront, CircleOff, Clock, MapPin, Phone, Ticket } from "lucide-react";
import { iconProps } from "@/components/ui/icon";
import type { ActivityPlace } from "@/features/places/model/place";

/** 핵심 정보 한 행. 행사 상세의 FactList와 같은 모양이다(.ai/DESIGN.md Components > FactList). */
function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
      <span className="mt-0.5 shrink-0 text-content-subtle">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 flex-1 text-body text-content-strong">{children}</dd>
    </div>
  );
}

/**
 * 즐길거리 상세의 핵심 정보: 운영시간, 휴무, 요금, 주소, 전화, 주차. 값이 없는 행은 뺀다.
 * 요금은 대표값 한 줄만 둔다. 시즌별·권종별 요금표는 옮기지 않고 공식 홈페이지로 보낸다(2026-11-21).
 */
export function PlaceFactList({ place }: { place: ActivityPlace }) {
  return (
    <section aria-labelledby="facts-title" className="mt-6">
      <h2 id="facts-title" className="sr-only">핵심 정보</h2>
      <dl>
        {place.hoursSummary !== null && (
          <Fact icon={<Clock {...iconProps} />} label="운영시간"><span className="whitespace-pre-line">{place.hoursSummary}</span></Fact>
        )}
        {place.closedSummary !== null && (
          <Fact icon={<CircleOff {...iconProps} />} label="휴무">{place.closedSummary}</Fact>
        )}
        {place.priceSummary !== null && (
          <Fact icon={<Ticket {...iconProps} />} label="요금"><span className="whitespace-pre-line">{place.priceSummary}</span></Fact>
        )}
        {place.address !== null && (
          <Fact icon={<MapPin {...iconProps} />} label="주소">{place.address}</Fact>
        )}
        {place.phone !== null && (
          <Fact icon={<Phone {...iconProps} />} label="전화">
            <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className="tabular-nums text-primary-text underline decoration-line-strong underline-offset-4">{place.phone}</a>
          </Fact>
        )}
        {place.parkingSummary !== null && (
          // 주차는 값이 "무료"·"가능"처럼 짧아 아이콘만으로는 요금과 헷갈린다. 이 행만 라벨을 화면에도 적는다.
          <Fact icon={<CarFront {...iconProps} />} label="주차"><span className="whitespace-pre-line"><span aria-hidden="true" className="text-content-muted">주차 </span>{place.parkingSummary}</span></Fact>
        )}
      </dl>
    </section>
  );
}
