import {
  createMobileEventSavePath,
  type MobileEventSummary,
} from "@/lib/mobile/event-bridge";

export function SaveEventButton({ event }: { event: MobileEventSummary }) {
  return (
    <div className="self-start">
      <a
        href={createMobileEventSavePath(event)}
        className="min-h-12 rounded-2xl border border-rose-600 bg-white px-5 py-3 font-bold text-rose-700 transition hover:bg-rose-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
      >
        관심 행사 저장
      </a>
    </div>
  );
}
