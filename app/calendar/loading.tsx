export default function CalendarLoading() {
  return (
    <main id="main-content" aria-busy="true" aria-label="행사 캘린더 불러오는 중" className="mx-auto min-h-[70vh] max-w-6xl animate-pulse px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 space-y-3" aria-hidden="true">
        <div className="h-4 w-40 rounded-full bg-teal-100" />
        <div className="h-12 w-64 rounded-2xl bg-slate-200" />
        <div className="h-5 max-w-2xl rounded-full bg-slate-100" />
      </div>
      <div className="h-32 rounded-3xl bg-white shadow-sm ring-1 ring-slate-100" aria-hidden="true" />
      <div className="mt-6 h-[38rem] rounded-3xl bg-white shadow-sm ring-1 ring-slate-100" aria-hidden="true" />
    </main>
  );
}
