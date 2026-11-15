import { getButtonClassName } from "@/components/ui/button-styles";
import { TransitionLink } from "@/components/ui/transition-link";

export default function EventNotFound() {
  return (
    <main id="main-content" className="mx-auto min-h-[60vh] max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="text-label font-bold text-primary-text">행사 정보 없음</p>
      <h1 className="mt-2 text-title-1 text-content-strong">공개된 행사를 찾을 수 없어요.</h1>
      <p className="mt-4 leading-7 text-content-muted">행사가 비공개로 전환됐거나 주소가 바뀌었을 수 있습니다.</p>
      <TransitionLink href="/" pendingLabel="행사 목록 불러오는 중" showPendingIndicator={false} className={`${getButtonClassName({ variant: "primary", width: "content" })} mt-8`}>
        행사 목록으로
      </TransitionLink>
    </main>
  );
}
