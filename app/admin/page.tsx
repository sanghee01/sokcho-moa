import { ActionFeedback } from "@/components/admin/action-feedback";
import { TransitionLink } from "@/components/ui/transition-link";
import { AdminShell } from "@/app/admin/_components/admin-shell";
import { AdminEventsTab } from "@/app/admin/_components/events-tab";
import { AdminExclusionsTab } from "@/app/admin/_components/exclusions-tab";
import { AdminPlacesTab } from "@/app/admin/_components/places-tab";
import { AdminFeedbackTab, AdminReportsTab } from "@/app/admin/_components/submission-tabs";
import { getAdminResultMessage } from "@/components/admin/admin-result";
import { isEventReviewStatus } from "@/features/events/model/review-status";
import { requireAdmin } from "@/lib/auth/admin";
import { firstSearchParam } from "@/lib/search-params";

// 이 페이지는 주소(?tab, ?status, ?page)를 해석하고 탭을 고르기만 한다. 각 탭은 _components에서 자기 데이터를 조회한다(2026-11-06).
const adminTabs = [
  { id: "events", label: "행사 관리" },
  { id: "exclusions", label: "재수집 제외" },
  { id: "reports", label: "접수된 제보" },
  { id: "feedback", label: "접수된 의견" },
  { id: "places", label: "주변 명소" },
] as const;

type AdminTab = (typeof adminTabs)[number]["id"];

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function isAdminTab(value?: string): value is AdminTab {
  return adminTabs.some((tab) => tab.id === value);
}

function adminTabHref(tab: AdminTab) {
  return tab === "events" ? "/admin" : `/admin?tab=${tab}`;
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const [admin, query] = await Promise.all([
    requireAdmin(),
    searchParams,
  ]);
  const [tab, status, page, result] = (["tab", "status", "page", "result"] as const)
    .map((name) => firstSearchParam(query[name]));
  const selectedTab = isAdminTab(tab) ? tab : "events";
  const feedbackMessage = getAdminResultMessage(result);

  return (
    <AdminShell email={admin.email}>
      <ActionFeedback message={feedbackMessage} />
      <nav aria-label="관리 항목" className="flex flex-wrap gap-2 rounded-card bg-surface p-2 ring-1 ring-line">
        {adminTabs.map((item) => (
          <TransitionLink
            key={item.id}
            href={adminTabHref(item.id)}
            showPendingIndicator={false}
            aria-current={selectedTab === item.id ? "page" : undefined}
            // 알약 탭(.ai/DESIGN.md Tabs): 높이 44px, 선택된 탭은 primary로 채운다.
            className={`inline-flex min-h-11 items-center rounded-control px-4 text-label font-semibold ${selectedTab === item.id ? "bg-primary text-on-primary" : "text-content hover:bg-surface-subtle"}`}
          >
            {item.label}
          </TransitionLink>
        ))}
      </nav>

      {selectedTab === "events" && (
        <AdminEventsTab status={isEventReviewStatus(status) ? status : undefined} requestedPage={parsePage(page)} />
      )}
      {selectedTab === "exclusions" && <AdminExclusionsTab />}
      {selectedTab === "reports" && <AdminReportsTab />}
      {selectedTab === "feedback" && <AdminFeedbackTab />}
      {selectedTab === "places" && <AdminPlacesTab />}
    </AdminShell>
  );
}
