import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminShell } from "@/app/admin/_components/admin-shell";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { importEventCandidateAction } from "@/features/events/admin/import-actions";
import { requireAdmin } from "@/lib/auth/admin";

const example = JSON.stringify({
  title: "확인된 행사명", summary: null, description: null, category: null, audiences: [],
  eventStartAt: null, eventEndAt: null, operatingHours: null, applicationStartAt: null,
  applicationEndAt: null, locationName: null, address: null, latitude: null, longitude: null,
  priceText: null, isFree: null, organizer: null, contact: null, officialUrl: null,
  applicationUrl: null, imageUrl: null, sourceName: "공식 출처 기관", sourceUrl: "https://example.com/original",
}, null, 2);

export default async function ImportCandidatePage() {
  const admin = await requireAdmin();
  return (
    <AdminShell email={admin.email}>
      <p className="text-label font-bold text-primary-text">AI·수집 작업 연결 지점</p>
      <h1 className="mt-1 text-title-2 font-bold">EventCandidate JSON 등록</h1>
      <p className="mt-3 max-w-3xl leading-7 text-content-muted">확인할 수 없는 값은 추측하지 말고 `null`로 두세요. `sourceUrl`은 기관 대표 홈이 아닌 행사별 공식 원문, `officialUrl`은 공식 안내, `applicationUrl`은 직접 신청·예매 주소입니다. `imageUrl`에 공식 포스터의 직접 URL을 넣으면 JPG·PNG·WebP를 받아 WebP로 최적화한 뒤 서비스 저장소에 등록합니다. 등록 결과는 항상 검수 대기 상태이며, 운영자가 보완한 뒤에만 공개할 수 있습니다.</p>
      <AdminActionForm action={importEventCandidateAction} className="mt-6 space-y-5 rounded-card bg-surface p-5 ring-1 ring-line sm:p-8">
        <label className="text-label font-bold text-content">후보 JSON<textarea required name="candidateJson" defaultValue={example} rows={24} spellCheck={false} className="mt-2 w-full rounded-card border border-line-input bg-content-strong p-4 font-mono text-label text-on-primary" /></label>
        <FormSubmitButton idleLabel="검수 대기로 등록" pendingLabel="등록 중…" className="rounded-card bg-primary px-6 py-3 font-bold text-on-primary" />
      </AdminActionForm>
    </AdminShell>
  );
}
