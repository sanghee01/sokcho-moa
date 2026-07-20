import type { Metadata } from "next";
import { EventReportForm } from "@/components/event-report-form";

export const metadata: Metadata = {
  title: "행사 제보하기",
  description: "속초모아에 아직 없는 행사·축제·프로그램을 제보해 주세요.",
  alternates: { canonical: "/report" },
};

export default function ReportPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-bold text-teal-700">속초의 소식을 알려주세요</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">행사 제보하기</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        사이트에 없는 행사·축제·프로그램 등을 제보해 주세요. 검토 후 반영 가능하다면 반영하겠습니다.
      </p>
      <div className="mt-9">
        <EventReportForm />
      </div>
    </main>
  );
}
