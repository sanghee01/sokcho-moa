type SubmissionFormSkeletonProps = {
  kind: "report" | "feedback";
};

const pulse = "animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none";

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
        <div className="h-4 w-44 rounded-full bg-teal-100" />
        <div className="mt-3 h-10 w-52 rounded-2xl bg-slate-200 sm:h-12 sm:w-64" />
        <div className="mt-5 space-y-2">
          <div className="h-4 w-full max-w-2xl rounded-full bg-slate-200" />
          <div className="h-4 w-3/4 max-w-xl rounded-full bg-slate-100" />
        </div>

        <div className="mt-9 space-y-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div>
            <div className={`${pulse} h-4 w-14`} />
            <div className={`${pulse} mt-2 h-12 w-full`} />
          </div>
          <div>
            <div className={`${pulse} h-4 w-14`} />
            <div className={`${pulse} mt-2 h-56 w-full rounded-2xl`} />
          </div>
          {additionalFields.map((field) => (
            <div key={field}>
              <div className={`${pulse} h-4 w-20`} />
              <div className={`${pulse} mt-2 h-12 w-full`} />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-100" />
            </div>
          ))}
          <div className="h-12 w-full rounded-2xl bg-teal-100 sm:w-32" />
        </div>
      </div>
      <span className="sr-only" role="status">{label} 화면을 불러오고 있습니다.</span>
    </main>
  );
}
