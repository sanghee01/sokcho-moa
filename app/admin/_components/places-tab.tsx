import { TransitionLink } from "@/components/ui/transition-link";
import { getAdminPlaces } from "@/features/places/admin/queries";

/** 관리자 대시보드의 "주변 명소" 탭 */
export async function AdminPlacesTab() {
  const places = await getAdminPlaces();
  return (
    <section className="mt-10" aria-labelledby="admin-places-title">
      <div className="mb-4 flex items-center justify-between"><h1 id="admin-places-title" className="text-title-2 font-bold text-content-strong">주변 명소 {places.length}곳</h1><TransitionLink href="/admin/places/new" className="text-label font-bold text-primary-text underline">명소 등록</TransitionLink></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{places.map((row) => <TransitionLink key={row.id} href={`/admin/places/${row.id}`} className="rounded-card bg-surface p-4 ring-1 ring-line hover:ring-primary"><p className="text-caption font-bold text-primary-text">{row.category}</p><p className="mt-1 font-bold">{row.name}</p><p className="mt-2 text-caption text-content-subtle">{row.is_published ? "공개" : "비공개"}</p></TransitionLink>)}</div>
    </section>
  );
}
