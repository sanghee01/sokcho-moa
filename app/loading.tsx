export default function Loading() {
  return (
    <main id="main-content" className="mx-auto max-w-6xl animate-pulse px-4 py-12 sm:px-6" aria-busy="true" aria-label="행사 목록 불러오는 중">
      <div className="h-10 w-72 rounded-xl bg-teal-100" />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-80 rounded-3xl bg-white shadow-sm" />)}
      </div>
    </main>
  );
}
