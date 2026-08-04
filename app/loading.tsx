const placeholderPanels = Array.from({ length: 3 }, (_, index) => index);

export default function AppLoading() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      aria-label="페이지 불러오는 중"
      className="min-h-[70vh]"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div
          aria-hidden="true"
          className="animate-pulse space-y-4 motion-reduce:animate-none"
        >
          <div className="h-9 w-48 rounded-xl bg-slate-200" />
          <div className="h-5 w-2/3 max-w-2xl rounded-lg bg-slate-100" />
          <div className="h-5 w-1/2 max-w-xl rounded-lg bg-slate-100" />

          <div className="grid gap-5 pt-6 md:grid-cols-3">
            {placeholderPanels.map((panel) => (
              <div
                key={panel}
                className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div className="h-7 w-2/3 rounded-lg bg-slate-200" />
                <div className="h-5 w-full rounded bg-slate-100" />
                <div className="h-5 w-4/5 rounded bg-slate-100" />
                <div className="h-11 w-32 rounded-xl bg-cyan-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only" role="status">페이지를 불러오고 있습니다.</span>
    </main>
  );
}
