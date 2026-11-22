import { getButtonClassName } from "@/components/ui/button-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import { getAdminPlaces } from "@/features/places/admin/queries";
import { activityCategoryLabels, isActivityCategory } from "@/features/places/model/activity";

/** 관리자 대시보드의 "장소" 탭. 행사 상세의 주변 명소 구역을 뺀 뒤(2026-11-21) 방문자에게는 가볼만한 곳 분류가 있는 장소만 보인다. */
export async function AdminPlacesTab() {
  const places = await getAdminPlaces();
  return (
    <section className="mt-10" aria-labelledby="admin-places-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 id="admin-places-title" className="text-title-2 text-content-strong">장소 {places.length}곳</h1>
        {/* 글자만 있는 링크 버튼은 쓰지 않는다(.ai/DESIGN.md Button). 위 관리자 메뉴와 같은 곳으로 가는 보조 버튼이다. */}
        <TransitionLink href="/admin/places/new" showPendingIndicator={false} className={getButtonClassName({ variant: "tonal" })}>명소 등록</TransitionLink>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((row) => (
          <TransitionLink key={row.id} href={`/admin/places/${row.id}`} className="rounded-card bg-surface p-4 ring-1 ring-line hover:ring-primary">
            <p className="text-caption font-bold text-primary-text">{row.category}</p>
            <p className="mt-1 font-bold">{row.name}</p>
            {/* 공개여도 분류가 없으면 방문자 화면 어디에도 나오지 않아, 관리자가 공개된 줄 착각하지 않게 함께 적는다. */}
            <p className="mt-2 text-caption text-content-subtle">
              {!row.is_published ? "비공개" : isActivityCategory(row.activity_category) ? `공개 · ${activityCategoryLabels[row.activity_category]}` : "공개 · 분류 없음(사이트에 보이지 않음)"}
            </p>
          </TransitionLink>
        ))}
      </div>
    </section>
  );
}
