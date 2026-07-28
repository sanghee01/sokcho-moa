import type { Metadata } from "next";
import { SiteFeedbackForm } from "@/components/site-feedback-form";
import { feedbackPageMetadata } from "@/lib/seo/utility-page-metadata";
import { isSiteFeedbackImageUploadAvailable } from "@/lib/supabase/service";

export const metadata: Metadata = feedbackPageMetadata;

export default async function FeedbackPage() {
  const imageUploadEnabled = await isSiteFeedbackImageUploadAvailable();

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-bold text-teal-700">속초모아를 함께 다듬어 주세요</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">의견 보내기</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        사이트를 사용하며 불편했던 점, 개선하면 좋을 점, 좋았던 점이나 사용평을 자유롭게 보내 주세요.
        보내주신 의견은 서비스 개선에 참고하겠습니다.
      </p>
      <div className="mt-9">
        <SiteFeedbackForm imageUploadEnabled={imageUploadEnabled} />
      </div>
    </main>
  );
}
