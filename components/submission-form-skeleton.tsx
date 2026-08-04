import { formContainerClassName } from "@/components/ui/form-styles";

type SubmissionFormSkeletonProps = {
  kind: "report" | "feedback";
};

const skeletonBlockClassName = "rounded-xl bg-skeleton";

export function SubmissionFormSkeleton({ kind }: SubmissionFormSkeletonProps) {
  const isFeedback = kind === "feedback";
  const label = isFeedback ? "의견 보내기" : "행사 제보하기";
  const additionalFields = isFeedback ? ["관련 링크", "사진 첨부"] : ["링크"];

  return (
    <main
      id="main-content"
      aria-busy="true"
      aria-label={`${label} 화면 불러오는 중`}
      className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6 sm:py-16"
    >
      <div className="animate-pulse motion-reduce:animate-none" aria-hidden="true">
        <div className="h-4 w-44 rounded-full bg-brand-100" />
        <div className="mt-3 h-10 w-52 rounded-2xl bg-skeleton sm:h-12 sm:w-64" />
        <div className="mt-5 space-y-2">
          <div className="h-4 w-full max-w-2xl rounded-full bg-skeleton" />
          <div className="h-4 w-3/4 max-w-xl rounded-full bg-surface-muted" />
        </div>

        <div className={`${formContainerClassName} mt-9`}>
          <div>
            <div className={`${skeletonBlockClassName} h-4 w-14`} />
            <div className={`${skeletonBlockClassName} mt-2 h-12 w-full`} />
          </div>
          <div>
            <div className={`${skeletonBlockClassName} h-4 w-14`} />
            <div className={`${skeletonBlockClassName} mt-2 h-56 w-full rounded-2xl`} />
          </div>
          {additionalFields.map((field) => (
            <div key={field}>
              <div className={`${skeletonBlockClassName} h-4 w-20`} />
              <div className={`${skeletonBlockClassName} mt-2 h-12 w-full`} />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-surface-muted" />
            </div>
          ))}
          <div className="h-12 w-full rounded-2xl bg-brand-100 sm:w-32" />
        </div>
      </div>
      <span className="sr-only" role="status">{label} 화면을 불러오고 있습니다.</span>
    </main>
  );
}
