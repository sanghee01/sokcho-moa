"use client";

import { useState } from "react";
import { EventReviewRow } from "@/components/admin/event-review-row";
import { StatusControls } from "@/components/admin/status-controls";

type ReviewStatus = "pending" | "published" | "rejected";

export function StatusControlsE2EHarness() {
  const [shouldFail, setShouldFail] = useState(false);

  async function performStatusChangeAction(input: {
    id: string;
    slug: string;
    status: ReviewStatus;
  }) {
    await new Promise((resolve) => window.setTimeout(resolve, 1_200));
    if (shouldFail) throw new Error("의도한 E2E 저장 실패");
    return { status: input.status };
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <fieldset className="mb-4 flex min-h-10 items-center gap-5">
        <legend className="sr-only">저장 결과</legend>
        <label className="flex items-center gap-2"><input type="radio" name="outcome" checked={!shouldFail} onChange={() => setShouldFail(false)} /> 성공</label>
        <label className="flex items-center gap-2"><input type="radio" name="outcome" checked={shouldFail} onChange={() => setShouldFail(true)} /> 실패</label>
      </fieldset>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">행사</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">출처</th><th className="px-4 py-3">작업</th></tr></thead>
          <tbody>
            <EventReviewRow
              event={{ id: "10000000-0000-4000-8000-000000000091", slug: "e2e-current", title: "현재 행사", sourceName: "속초시", reviewStatus: "pending" }}
              performStatusChangeAction={performStatusChangeAction}
            />
            <EventReviewRow
              event={{ id: "10000000-0000-4000-8000-000000000092", slug: "e2e-adjacent", title: "인접 행사", sourceName: "속초문화재단", reviewStatus: "pending" }}
              performStatusChangeAction={performStatusChangeAction}
            />
          </tbody>
        </table>
      </div>

      <section aria-labelledby="edit-e2e-title" className="mt-10">
        <div data-testid="edit-header" className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 id="edit-e2e-title" className="text-2xl font-black">행사 수정 테스트</h1>
          <StatusControls
            id="10000000-0000-4000-8000-000000000093"
            slug="e2e-edit"
            current="pending"
            performStatusChangeAction={performStatusChangeAction}
          />
        </div>
        <div data-testid="edit-adjacent" className="h-40 rounded-3xl bg-white p-5 ring-1 ring-slate-200">행사 수정 폼 인접 영역</div>
      </section>
    </main>
  );
}
