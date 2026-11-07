import type { ReactNode } from "react";
import type { Event } from "@/features/events/model/event";
import { formatAudiences } from "@/features/events/model/format";

/** 행사 정보 묶음의 한 행(라벨이 보이는 목록) */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 border-t border-line py-3 first:border-t-0">
      <dt className="text-label font-normal text-content-subtle">{label}</dt>
      <dd className="min-w-0 text-label font-normal text-content-strong">{children}</dd>
    </div>
  );
}

/**
 * 행사 상세의 "행사 정보"(참여 대상, 주최·주관, 문의처). 상세 페이지의 왼쪽 열(lg)에 놓인다.
 * 보여 줄 값이 하나도 없으면 제목만 남지 않게 묶음 전체를 그리지 않는다.
 */
export function EventInfoList({ event }: { event: Pick<Event, "audiences" | "organizer" | "contact"> }) {
  const audiences = formatAudiences(event.audiences);
  const hasInfo = Boolean(audiences || event.organizer || event.contact);
  if (!hasInfo) return null;

  return (
    <section aria-labelledby="event-info-title" className="mt-10 px-4 lg:col-start-1 lg:px-0">
      <h2 id="event-info-title" className="text-title-2 text-content-strong">행사 정보</h2>
      <dl className="mt-3 max-w-160">
        {Boolean(audiences) && <InfoRow label="참여 대상">{audiences}</InfoRow>}
        {Boolean(event.organizer) && <InfoRow label="주최·주관">{event.organizer}</InfoRow>}
        {Boolean(event.contact) && <InfoRow label="문의처">{event.contact}</InfoRow>}
      </dl>
    </section>
  );
}
