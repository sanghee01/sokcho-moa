import { redirect } from "next/navigation";
import { buildEventBrowseHref, type EventSearchParams } from "@/features/events/model/browse-url";

type CalendarPageProps = {
  searchParams: Promise<EventSearchParams>;
};

// 캘린더 기능은 삭제했다. 기존 북마크는 같은 필터의 진행 중 목록으로 보낸다.
export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  redirect(buildEventBrowseHref(params, { view: undefined, month: undefined, status: undefined }));
}
