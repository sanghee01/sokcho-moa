type SkeletonVariant = "dashboard" | "form" | "import";

const pulse = "animate-pulse rounded-control bg-skeleton motion-reduce:animate-none";

function AdminHeaderSkeleton() {
  return (
    <header className="mb-8 flex flex-col gap-4 rounded-card bg-surface-subtle p-5 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2"><div className={`${pulse} h-4 w-28`} /><div className={`${pulse} h-4 w-40`} /></div>
      <div className="flex flex-wrap gap-2">{Array.from({ length: 5 }, (_, index) => <div key={index} className={`${pulse} h-11 w-20`} />)}</div>
    </header>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className={`${pulse} h-28`} />)}</div>
      <section className="mt-10 space-y-4"><div className={`${pulse} h-8 w-32`} /><div className={`${pulse} h-80 w-full rounded-card`} /></section>
      <section className="mt-10 space-y-4"><div className={`${pulse} h-8 w-44`} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className={`${pulse} h-28`} />)}</div></section>
    </>
  );
}

function FormSkeleton() {
  return (
    <>
      <div className={`${pulse} mb-5 h-8 w-36`} />
      <div className="grid gap-5 rounded-card bg-surface p-5 ring-1 ring-line sm:grid-cols-2 sm:p-8">
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className={index === 4 || index === 5 ? "sm:col-span-2" : ""}>
            <div className={`${pulse} h-4 w-20`} />
            <div className={`${pulse} mt-2 ${index === 4 || index === 5 ? "h-24" : "h-11"} w-full`} />
          </div>
        ))}
      </div>
    </>
  );
}

function ImportSkeleton() {
  return (
    <>
      <div className={`${pulse} h-4 w-44`} />
      <div className={`${pulse} mt-3 h-8 w-64`} />
      <div className={`${pulse} mt-5 h-16 max-w-3xl`} />
      <div className="mt-6 rounded-card bg-surface p-5 ring-1 ring-line sm:p-8"><div className={`${pulse} h-128 w-full`} /></div>
    </>
  );
}

export function AdminPageSkeleton({ variant = "dashboard" }: { variant?: SkeletonVariant }) {
  return (
    <main id="main-content" aria-busy="true" aria-label="운영자 화면을 불러오는 중" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <AdminHeaderSkeleton />
      {variant === "dashboard" && <DashboardSkeleton />}
      {variant === "form" && <FormSkeleton />}
      {variant === "import" && <ImportSkeleton />}
      <span className="sr-only" role="status">운영자 화면을 불러오고 있습니다.</span>
    </main>
  );
}
