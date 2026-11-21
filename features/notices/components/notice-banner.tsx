import { Megaphone } from "lucide-react";
import Link from "next/link";
import { iconProps } from "@/components/ui/icon";
import { NoticeBannerFrame } from "@/features/notices/components/notice-banner-frame";
import { DISMISSED_NOTICE_STORAGE_KEY, noticeKindLabels, noticePath } from "@/features/notices/model/notice";
import { getBannerNotice } from "@/features/notices/queries";
import { isUuid } from "@/lib/uuid";

/**
 * 새 공지를 헤더 아래 한 줄로 알린다(.ai/DESIGN.md NoticeBanner). 공개한 지 14일이 지나지 않은 가장 최근 글 하나만 보인다.
 * 닫은 방문자에게 다시 그렸다 지우면 화면이 덜컹거리므로, 띠 바로 뒤의 inline script가 첫 그리기 전에 숨긴다.
 * 쿠키로 서버에서 판단하면 모든 페이지가 요청마다 새로 만들어져(동적) 미리 만든 페이지를 쓸 수 없다.
 * 홈·분야 목록에서도 같은 띠로 알린다. 위쪽 배너는 "지금 많이 보는 행사"만 둔다(2026-11-21 사용자 결정).
 */
export async function NoticeBanner() {
  const notice = await getBannerNotice();
  // id를 script 안에 넣으므로 uuid 모양일 때만 그린다.
  if (notice === null || !isUuid(notice.id)) return null;
  const hideDismissedScript = `(function(){try{if(window.localStorage.getItem(${JSON.stringify(DISMISSED_NOTICE_STORAGE_KEY)})===${JSON.stringify(notice.id)}){document.currentScript.previousElementSibling.hidden=true}}catch(e){}})()`;

  return (
    <>
      <NoticeBannerFrame noticeId={notice.id}>
        <Link href={noticePath(notice.id)} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-label text-content-strong">
          <Megaphone {...iconProps} size={16} className="shrink-0 text-primary-text" />
          <span className="shrink-0 font-semibold text-primary-text">{noticeKindLabels[notice.kind]}</span>
          <span className="truncate font-medium">{notice.title}</span>
        </Link>
      </NoticeBannerFrame>
      <script dangerouslySetInnerHTML={{ __html: hideDismissedScript }} />
    </>
  );
}
