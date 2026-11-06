import { redirect } from "next/navigation";
import { buildEventBrowseHref } from "@/features/events/model/browse-url";

// 캘린더 기능은 삭제했다. 기존 북마크는 같은 필터의 진행 중 목록으로 보낸다.
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const params = await searchParams;
  // 이동 경로는 사용자 입력(__browsePath)에서 받지 않고 목록 홈으로 고정한다.
  redirect(buildEventBrowseHref(params, { view: undefined, month: undefined, status: undefined }, "/"));
}
