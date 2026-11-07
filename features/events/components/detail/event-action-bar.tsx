import { getButtonClassName } from "@/components/ui/button-styles";
import { ShareEventButton } from "@/features/events/components/detail/share-event-button";
import type { Event } from "@/features/events/model/event";
import { analyticsData } from "@/lib/analytics/events";

/**
 * 행사 상세의 행동 버튼(.ai/DESIGN.md Components > BottomActionBar). 한 벌만 두고, 모바일은 화면 아래에 고정하고 lg에서는 핵심 정보 아래에 둔다.
 * 행사 안내는 모든 행사에 있어 항상 파랑(primary)이고, 신청 링크가 있으면 그 앞에 신청·예매를 차콜(accent)로 둔다.
 * 둘 다 눈에 띄어야 해서 채운 버튼으로 두고 색으로 구분한다(상황마다 색이 바뀌어 헷갈렸음, 2026-11-07 사용자 결정).
 * 아래 여백은 20px + safe area다. 12px이면 실제 iPhone에서 화면 둥근 모서리에 버튼 왼쪽 아래가 잘렸다(2026-11-07).
 * 하단 바만큼의 페이지 아래 여백은 body에 둔다(globals.css의 data-bottom-action-bar).
 */
export function EventActionBar({ event }: { event: Pick<Event, "slug" | "category" | "applicationUrl" | "sourceUrl"> }) {
  // 빈 문자열도 신청 링크가 없는 것으로 본다.
  const applicationUrl = event.applicationUrl || null;
  const hasApplicationUrl = applicationUrl !== null;

  return (
    <div
      data-bottom-action-bar
      className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-surface px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-floating lg:static lg:z-auto lg:mt-6 lg:border-t-0 lg:bg-transparent lg:p-0 lg:shadow-none"
    >
      {applicationUrl !== null && (
        <a
          href={applicationUrl}
          target="_blank"
          rel="noreferrer"
          {...analyticsData("application_link_clicked", { event_slug: event.slug, event_category: event.category, link_position: "action_bar" })}
          className={`${getButtonClassName({ variant: "accent" })} min-w-0 flex-1`}
        >
          신청·예매 <span className="sr-only">(새 창)</span>
        </a>
      )}
      <a
        href={event.sourceUrl}
        target="_blank"
        rel="noreferrer"
        {...analyticsData("source_link_clicked", { event_slug: event.slug, event_category: event.category, link_position: "action_bar", source_type: "primary" })}
        className={`${getButtonClassName({ variant: "primary" })} ${hasApplicationUrl ? "shrink-0" : "min-w-0 flex-1"}`}
      >
        행사 안내 <span className="sr-only">(새 창)</span>
      </a>
      <ShareEventButton slug={event.slug} />
    </div>
  );
}
