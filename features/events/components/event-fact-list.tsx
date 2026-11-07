import type { ReactNode } from "react";
import { CalendarDays, Clock, ExternalLink, MapPin, PenLine, Ticket } from "lucide-react";
import { iconProps } from "@/components/ui/icon";
import { LiveApplicationStateLabel } from "@/features/events/components/live-event-status";
import type { Event } from "@/features/events/model/event";
import {
  applicationStateLabels,
  formatApplicationPeriod,
  formatOperatingSchedule,
  formatPrice,
  formatShortDateRange,
} from "@/features/events/model/format";
import { createEventMapLinks } from "@/features/events/model/location";
import { pickEventStatusFields } from "@/features/events/model/status-fields";
import { analyticsData } from "@/lib/analytics/events";

/** 핵심 정보 한 행. 라벨은 화면 읽기 프로그램용으로 남기고, 화면에는 아이콘과 값만 보인다(.ai/DESIGN.md Components > FactList). */
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
 * 행사 상세의 핵심 정보: 날짜, 운영 시간, 장소, 요금, 신청(.ai/DESIGN.md Components > FactList).
 * 신청 상태는 시간이 지나면 바뀌므로 브라우저의 현재 시각으로 다시 계산한다. renderedAt은 서버가 그린 시각이다.
 */
export function EventFactList({ event, renderedAt }: { event: Event; renderedAt: string }) {
  const mapLinks = createEventMapLinks(
    event.locationName ?? event.title,
    event.address,
    event.latitude,
    event.longitude,
  );
  const applicationPeriod = formatApplicationPeriod(event.applicationStartAt, event.applicationEndAt);
  const hasOperatingHours = Boolean(event.operatingHours?.trim());

  return (
    <section aria-labelledby="facts-title" className="mt-5">
      <h2 id="facts-title" className="sr-only">핵심 정보</h2>
      <dl>
        <Fact icon={<CalendarDays {...iconProps} />} label="날짜">
          <span className="tabular-nums">{formatShortDateRange(event.eventStartAt, event.eventEndAt)}</span>
        </Fact>
        {hasOperatingHours && (
          <Fact icon={<Clock {...iconProps} />} label="운영 시간">
            <span className="whitespace-pre-line">{formatOperatingSchedule(event.operatingHours)}</span>
          </Fact>
        )}
        <Fact icon={<MapPin {...iconProps} />} label="장소">
          <span className="block">{event.locationName ?? "장소는 원문에서 확인해 주세요"}</span>
          {Boolean(event.address) && <span className="mt-0.5 block text-label font-normal text-content-muted">{event.address}</span>}
          {mapLinks !== null && (
            <a
              href={mapLinks.naver}
              target="_blank"
              rel="noreferrer"
              {...analyticsData("map_link_clicked", { event_slug: event.slug, event_category: event.category, link_position: "facts_address", map_method: mapLinks.hasCoordinates ? "coordinates" : "search" })}
              className="mt-1 inline-flex min-h-11 items-center gap-1 text-label font-medium text-primary-text underline decoration-line-strong underline-offset-4 hover:decoration-primary"
            >
              네이버 지도 <ExternalLink {...iconProps} size={14} /><span className="sr-only">(새 창)</span>
            </a>
          )}
        </Fact>
        <Fact icon={<Ticket {...iconProps} />} label="요금">{formatPrice(event)}</Fact>
        <Fact icon={<PenLine {...iconProps} />} label="신청">
          {applicationPeriod ? (
            <>
              <span className="tabular-nums">{applicationPeriod}</span>
              {" · "}
              <span className="font-semibold"><LiveApplicationStateLabel status={pickEventStatusFields(event)} renderedAt={renderedAt} /></span>
            </>
          ) : applicationStateLabels.not_applicable}
        </Fact>
      </dl>
    </section>
  );
}
