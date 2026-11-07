import { EventCollectionExclusionReleaseControl } from "@/features/events/admin/components/exclusion-release-control";
import type { AdminEventCollectionExclusion } from "@/features/events/admin/queries";
import { formatSeoulDateTime } from "@/lib/seoul-time";


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
  return Number.isNaN(deletedAt.getTime()) ? "삭제일 미상" : `${formatSeoulDateTime(deletedAt)} 삭제`;
}

export function EventCollectionExclusionList({
  exclusions,
}: {
  exclusions: AdminEventCollectionExclusion[];
}) {
  return (
    <section className="mt-10" aria-labelledby="admin-event-exclusions-title">
      <div className="mb-4">
        <h2 id="admin-event-exclusions-title" className="text-title-2 text-content-strong">
          재수집 제외 {exclusions.length}건
        </h2>
        <p className="mt-1 text-label leading-6 text-content-muted">
          삭제한 행사는 아래 식별 정보와 일치하면 수집·등록 과정에서 다시 추가되지 않습니다.
        </p>
      </div>
      <div className="overflow-hidden rounded-card bg-surface ring-1 ring-line">
        {exclusions.length === 0 ? (
          <p className="px-5 py-8 text-center text-label text-content-subtle">재수집에서 제외된 행사가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {exclusions.map((exclusion) => (
              <li key={exclusion.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="font-bold text-content-strong">
                      {exclusion.originalTitle ?? exclusion.originalSlug ?? "제목 없는 행사"}
                    </h3>
                    <time dateTime={exclusion.deletedAt} className="text-caption text-content-subtle">
                      {formatDeletedAt(exclusion.deletedAt)}
                    </time>
                  </div>
                  {Boolean(exclusion.originalTitle && exclusion.originalSlug) && (
                    <p className="mt-1 break-all text-caption text-content-subtle">/{exclusion.originalSlug}</p>
                  )}
                  {Boolean(exclusion.reason) && (
                    <p className="mt-2 text-label leading-6 text-content-muted">사유: {exclusion.reason}</p>
                  )}
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="재수집 제외 식별 정보">
                    {exclusion.identities.map((identity, index) => (
                      <li
                        key={`${identity.kind}-${identity.identityValue}-${index}`}
                        className="max-w-full rounded-control bg-surface-muted px-2.5 py-1 text-caption text-content"
                      >
                        <span className="font-bold">{identityKindLabels[identity.kind] ?? identity.kind}</span>{" "}
                        <span className="break-all">{identity.identityValue}</span>
                        {Boolean(identity.sourceUrl) && identity.sourceUrl !== identity.identityValue && (
                          <span className="mt-0.5 block break-all text-content-subtle">출처: {identity.sourceUrl}</span>
                        )}
                      </li>
                    ))}
                    {exclusion.identities.length === 0 && (
                      <li className="text-caption text-content-subtle">저장된 식별 정보가 없습니다.</li>
                    )}
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
