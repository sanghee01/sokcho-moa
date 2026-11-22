import { ChevronRight, ExternalLink, MessageCircle, MessageSquareText, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { iconProps } from "@/components/ui/icon";
import { listRowLinkClassName } from "@/components/ui/list-row-styles";
import { SITE_INQUIRY_URL } from "@/lib/seo/site-identity";
import { contactPageMetadata } from "@/lib/seo/utility-page-metadata";

export const metadata: Metadata = contactPageMetadata;

const contactOptionClassName = `${listRowLinkClassName} min-h-20 gap-4 py-4 text-content-strong`;

/**
 * 문의(.ai/DESIGN.md 문의). 헤더 "문의"가 카카오톡 오픈채팅으로 바로 나가던 것을, 제보(행사·가볼만한 곳)·의견 보내기·카카오톡 문의를 고르는 한 화면으로 모았다(2026-11-21 사용자 결정).
 * 세 가지는 서로 다른 일이라 탭으로 한 화면에서 바꾸지 않고, 고른 뒤 각 화면으로 간다(NN/g Tabs: 탭은 같은 주제의 다른 보기에 쓴다).
 * 제보·의견 폼은 원래 주소(/report, /feedback)에 그대로 있다.
 */
export default function ContactPage() {
  return (
    <main id="main-content" className="mx-auto max-w-160 px-4 pb-16 pt-8 lg:pt-12">
      <h1 className="text-title-1 text-content-strong lg:text-title-1-lg">문의</h1>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        <li>
          <Link href="/report" className={contactOptionClassName}>
            <Send {...iconProps} size={24} className="shrink-0 text-primary-text" />
            <span className="min-w-0 flex-1">
              <span className="block text-title-3">제보하기</span>
              <span className="mt-0.5 block text-label font-normal text-content-muted">사이트에 없는 행사나 가볼만한 곳을 알려 주세요.</span>
            </span>
            <ChevronRight {...iconProps} className="shrink-0 text-content-subtle" />
          </Link>
        </li>
        <li>
          <Link href="/feedback" className={contactOptionClassName}>
            <MessageSquareText {...iconProps} size={24} className="shrink-0 text-primary-text" />
            <span className="min-w-0 flex-1">
              <span className="block text-title-3">의견 보내기</span>
              <span className="mt-0.5 block text-label font-normal text-content-muted">불편했던 점이나 바라는 점을 남겨 주세요.</span>
            </span>
            <ChevronRight {...iconProps} className="shrink-0 text-content-subtle" />
          </Link>
        </li>
        <li>
          <a href={SITE_INQUIRY_URL} target="_blank" rel="noreferrer" className={contactOptionClassName}>
            <MessageCircle {...iconProps} size={24} className="shrink-0 text-primary-text" />
            <span className="min-w-0 flex-1">
              <span className="block text-title-3">카카오톡으로 묻기<span className="sr-only">(새 창)</span></span>
              <span className="mt-0.5 block text-label font-normal text-content-muted">답이 필요한 질문은 오픈채팅으로 물어봐 주세요.</span>
            </span>
            <ExternalLink {...iconProps} className="shrink-0 text-content-subtle" />
          </a>
        </li>
      </ul>
    </main>
  );
}
