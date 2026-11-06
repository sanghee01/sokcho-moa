import { SubmissionReviewCard } from "@/components/admin/submission-review-card";
import { deleteSiteFeedbackAction, setSiteFeedbackReviewStatusAction } from "@/features/feedback/admin/actions";
import { toSiteFeedbackCardData } from "@/features/feedback/admin/mappers";
import { getAdminSiteFeedback } from "@/features/feedback/admin/queries";
import { deleteEventReportAction, setEventReportReviewStatusAction } from "@/features/reports/admin/actions";
import { toEventReportCardData } from "@/features/reports/admin/mappers";
import { getAdminEventReports } from "@/features/reports/admin/queries";

// 제보와 의견 탭은 모양이 같지만 action·mapper가 달라 앞으로 갈라질 수 있어 컴포넌트는 따로 둔다(2026-11-06).

/** 관리자 대시보드의 "접수된 제보" 탭 */
export async function AdminReportsTab() {
  const reports = await getAdminEventReports();
  return (
    <section className="mt-10" aria-labelledby="admin-reports-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 id="admin-reports-title" className="text-title-2 font-bold text-content-strong">접수된 제보 {reports.length}건</h1>
      </div>
      <div className="space-y-3">
        {reports.map((report) => (
          <SubmissionReviewCard
            key={report.id}
            kind="event_report"
            setReviewStatus={setEventReportReviewStatusAction}
            deleteSubmission={deleteEventReportAction}
            submission={toEventReportCardData(report)}
          />
        ))}
        {reports.length === 0 && <p className="rounded-card bg-surface px-5 py-10 text-center text-content-subtle ring-1 ring-line">접수된 제보가 없습니다.</p>}
      </div>
    </section>
  );
}

/** 관리자 대시보드의 "접수된 의견" 탭 */
export async function AdminFeedbackTab() {
  const feedback = await getAdminSiteFeedback();
  return (
    <section className="mt-10" aria-labelledby="admin-feedback-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 id="admin-feedback-title" className="text-title-2 font-bold text-content-strong">접수된 의견 {feedback.length}건</h1>
      </div>
      <div className="space-y-3">
        {feedback.map((item) => (
          <SubmissionReviewCard
            key={item.id}
            kind="site_feedback"
            setReviewStatus={setSiteFeedbackReviewStatusAction}
            deleteSubmission={deleteSiteFeedbackAction}
            submission={toSiteFeedbackCardData(item)}
          />
        ))}
        {feedback.length === 0 && <p className="rounded-card bg-surface px-5 py-10 text-center text-content-subtle ring-1 ring-line">접수된 의견이 없습니다.</p>}
      </div>
    </section>
  );
}
