import { redirect } from "next/navigation";
import { calendarRedirectHref } from "@/features/events/model/browse-url";

// 캘린더 기능은 삭제했다. 기존 북마크는 같은 필터의 진행 중 목록으로 보낸다.
// 주소로 바로 열면 proxy.ts가 그리기 전에 307로 보낸다. cacheComponents에서는 여기서 보내는 redirect가 상태 코드 200에 담긴
// 브라우저 이동이 되기 때문이다(2026-11-24). proxy는 사이트 안 이동의 데이터 요청까지 모두 보내므로, 아래 redirect는 proxy matcher가
// 빠졌을 때를 위한 안전장치다.
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  redirect(calendarRedirectHref(await searchParams));
}
