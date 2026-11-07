import { EventImage } from "@/features/events/components/event-image";
import { EventImagePlaceholder } from "@/features/events/components/event-image-placeholder";

/**
 * 같은 포스터를 크게 흐려 깐 배경과 어두운 막. 포스터 비율이 제각각이어도 빈 곳 없이 채운다(목록 배너·상세 공통, 2026-11-06 사용자 결정).
 * 장식이 아니라 그 행사 포스터에서 나온 배경이라 .ai/DESIGN.md의 블러 금지에서 뺀다(Elevation & Depth).
 * 예전에는 배너와 상세가 같은 마크업을 따로 가지고 있었다(2026-11-07). 감싸는 요소는 relative·overflow-hidden이어야 한다.
 */
export function PosterBackdrop({ imageUrl }: { imageUrl: string | null }) {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 scale-125 blur-2xl">
        <EventImage src={imageUrl} alt="" sizes="20vw" fallback={<EventImagePlaceholder />} />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-image-scrim" />
    </>
  );
}
