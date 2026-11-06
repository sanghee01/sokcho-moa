import type { Metadata } from "next";
import { SiteFeedbackForm } from "@/features/feedback/components/site-feedback-form";
import { feedbackPageMetadata } from "@/lib/seo/utility-page-metadata";

export const metadata: Metadata = feedbackPageMetadata;

export default function FeedbackPage() {
  return (
    // 폼은 한 열, 최대 폭 40rem(.ai/DESIGN.md 제보·의견 폼)
    <main id="main-content" className="mx-auto max-w-160 px-4 pb-16 pt-8 lg:pt-12">
      <h1 className="text-title-1 text-content-strong lg:text-title-1-lg">의견 보내기</h1>
      <p className="mt-2 text-body text-content-muted">사이트를 쓰며 불편했던 점, 개선하면 좋을 점, 좋았던 점을 자유롭게 보내 주세요.</p>
      <div className="mt-8">
        <SiteFeedbackForm />
      </div>
    </main>
  );
}
