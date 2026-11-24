import { redirect } from "next/navigation";
import { connection } from "next/server";
import { eventMonthPath, getCurrentEventMonth } from "@/features/events/model/event-month";

// 행사 목록 상태 탭 "월별"의 목적지(2026-11-21, 그 전에는 헤더 버튼). 링크에 이번 달 주소를 직접 쓰면 정적으로 만든 페이지에서
// 빌드한 달에 멈춘다. 이 주소가 요청한 때의 이번 달 페이지로 보낸다(2026-11-15).
// 주소로 바로 열면 proxy.ts가 그리기 전에 307로 보낸다. cacheComponents에서는 여기서 보내는 redirect가 상태 코드 200에 담긴
// 브라우저 이동이 되기 때문이다(2026-11-24). proxy는 상태 탭 "월별"처럼 사이트 안에서 이동할 때의 데이터 요청까지 모두 보내므로,
// 아래 redirect는 proxy matcher가 빠졌을 때를 위한 안전장치다.

export default async function EventMonthsPage() {
  // 빌드 때 미리 만들면 그때의 달로 고정되므로, 요청이 올 때까지 기다린다.
  await connection();
  redirect(eventMonthPath(getCurrentEventMonth()));
}
