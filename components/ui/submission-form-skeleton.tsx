import { formContainerClassName } from "@/components/ui/form-styles";

interface SubmissionFormSkeletonProps {
  kind: "report" | "feedback";
}

const skeletonBlockClassName = "rounded-control bg-skeleton";

/** 제보·의견 화면 로딩 자리 표시. 실제 폼과 같은 한 열·40rem 배치를 따른다. */
export function SubmissionFormSkeleton({ kind }: SubmissionFormSkeletonProps) {
  const isFeedback = kind === "feedback";
  const label = isFeedback ? "의견 보내기" : "행사 제보하기";
  const additionalFields = isFeedback ? ["관련 링크", "사진 첨부"] : ["링크"];

  return (
    <main
      id="main-content"
      aria-busy="true"
      aria-label={`${label} 화면 불러오는 중`}
      className="mx-auto min-h-[70vh] max-w-160 px-4 pb-16 pt-8 lg:pt-12"
    >
      <div className="animate-pulse motion-reduce:animate-none" aria-hidden="true">
        <div className={`${skeletonBlockClassName} h-8 w-48`} />
        <div className={`${skeletonBlockClassName} mt-3 h-4 w-full`} />

        <div className={`${formContainerClassName} mt-8`}>
          <div>
            <div className={`${skeletonBlockClassName} h-4 w-14`} />
            <div className={`${skeletonBlockClassName} mt-2 h-12 w-full`} />
          </div>
          <div>
            <div className={`${skeletonBlockClassName} h-4 w-14`} />
            <div className={`${skeletonBlockClassName} mt-2 h-48 w-full`} />
          </div>
          {additionalFields.map((field) => (
            <div key={field}>
              <div className={`${skeletonBlockClassName} h-4 w-20`} />
              <div className={`${skeletonBlockClassName} mt-2 h-12 w-full`} />
            </div>
          ))}
          <div className={`${skeletonBlockClassName} h-13 w-full`} />
        </div>
      </div>
      <span className="sr-only" role="status">{label} 화면을 불러오고 있습니다.</span>
    </main>
  );
}
