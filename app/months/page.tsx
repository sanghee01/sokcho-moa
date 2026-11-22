import { redirect } from "next/navigation";
import { connection } from "next/server";
import { eventMonthPath, getCurrentEventMonth } from "@/features/events/model/event-month";

// 행사 목록 상태 탭 "월별"의 목적지(2026-11-21, 그 전에는 헤더 버튼). 링크에 이번 달 주소를 직접 쓰면 정적으로 만든 페이지에서
// 빌드한 달에 멈춘다. 이 주소가 요청한 때의 이번 달 페이지로 보낸다(2026-11-15).
export default async function EventMonthsPage() {
  // 빌드 때 미리 만들면 그때의 달로 고정되므로, 요청이 올 때까지 기다린다.
  await connection();
  redirect(eventMonthPath(getCurrentEventMonth()));
}
