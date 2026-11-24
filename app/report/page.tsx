import type { Metadata } from "next";
import { FreshOnNewVisit } from "@/components/layout/fresh-on-new-visit";
import { EventReportForm } from "@/features/reports/components/event-report-form";
import { reportPageMetadata } from "@/lib/seo/utility-page-metadata";

export const metadata: Metadata = reportPageMetadata;

export default function ReportPage() {
  return (
    // 폼은 한 열, 최대 폭 40rem(.ai/DESIGN.md 제보·의견 폼)
    <main id="main-content" className="mx-auto max-w-160 px-4 pb-16 pt-8 lg:pt-12">
      <h1 className="text-title-1 text-content-strong lg:text-title-1-lg">제보하기</h1>
      <p className="mt-2 text-body text-content-muted">사이트에 없는 행사·축제나 가볼만한 곳을 알려 주세요. 확인한 뒤 반영할 수 있으면 등록하겠습니다.</p>
      <div className="mt-8">
        {/* 메뉴로 다시 들어오면 빈 폼부터 시작한다. 숨겨 둔 화면(cacheComponents)에 이전 접수 결과가 남지 않게 한다(2026-11-24). */}
        <FreshOnNewVisit>
          <EventReportForm />
        </FreshOnNewVisit>
      </div>
    </main>
  );
}
