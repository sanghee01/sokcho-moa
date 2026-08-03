import { EventCollectionExclusionReleaseControl } from "@/components/admin/event-collection-exclusion-release-control";
import type { AdminEventCollectionExclusion } from "@/lib/admin/queries";

const deletedAtFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

const identityKindLabels: Record<string, string> = {
  external_id: "외부 ID",
  normalized_title: "정규화 제목",
  slug: "슬러그",
  source_external_id: "출처 ID",
  source_url: "출처 URL",
  title: "제목",
  url: "출처 URL",
};

function formatDeletedAt(value: string) {
  const deletedAt = new Date(value);
  return Number.isNaN(deletedAt.getTime()) ? "삭제일 미상" : `${deletedAtFormatter.format(deletedAt)} 삭제`;
}

export function EventCollectionExclusionList({
  exclusions,
}: {
  exclusions: AdminEventCollectionExclusion[];
}) {
  return (
    <section className="mt-10" aria-labelledby="admin-event-exclusions-title">
      <div className="mb-4">
        <h2 id="admin-event-exclusions-title" className="text-2xl font-black text-slate-950">
          재수집 제외 {exclusions.length}건
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          삭제한 행사는 아래 식별 정보와 일치하면 수집·등록 과정에서 다시 추가되지 않습니다.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {exclusions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">재수집에서 제외된 행사가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {exclusions.map((exclusion) => (
              <li key={exclusion.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="font-black text-slate-950">
                      {exclusion.originalTitle ?? exclusion.originalSlug ?? "제목 없는 행사"}
                    </h3>
                    <time dateTime={exclusion.deletedAt} className="text-xs text-slate-500">
                      {formatDeletedAt(exclusion.deletedAt)}
                    </time>
                  </div>
                  {exclusion.originalTitle && exclusion.originalSlug ? (
                    <p className="mt-1 break-all text-xs text-slate-500">/{exclusion.originalSlug}</p>
                  ) : null}
                  {exclusion.reason ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">사유: {exclusion.reason}</p>
                  ) : null}
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="재수집 제외 식별 정보">
                    {exclusion.identities.map((identity, index) => (
                      <li
                        key={`${identity.kind}-${identity.identityValue}-${index}`}
                        className="max-w-full rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                      >
                        <span className="font-bold">{identityKindLabels[identity.kind] ?? identity.kind}</span>{" "}
                        <span className="break-all">{identity.identityValue}</span>
                        {identity.sourceUrl && identity.sourceUrl !== identity.identityValue ? (
                          <span className="mt-0.5 block break-all text-slate-500">출처: {identity.sourceUrl}</span>
                        ) : null}
                      </li>
                    ))}
                    {exclusion.identities.length === 0 ? (
                      <li className="text-xs text-slate-500">저장된 식별 정보가 없습니다.</li>
                    ) : null}
                  </ul>
                </div>
                <EventCollectionExclusionReleaseControl
                  id={exclusion.id}
                  title={exclusion.originalTitle ?? exclusion.originalSlug ?? "행사"}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
