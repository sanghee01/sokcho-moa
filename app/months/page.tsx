import { redirect } from "next/navigation";
import { connection } from "next/server";
import { eventMonthPath, getCurrentEventMonth } from "@/features/events/model/event-month";

// 헤더 "월별 일정" 버튼의 목적지. 헤더는 정적으로 만든 페이지(제보·개인정보 등)에도 있어서 이번 달 주소를 직접 쓰면
// 빌드한 달에 멈춘다. 이 주소가 요청한 때의 이번 달 페이지로 보낸다(2026-11-15).
export default async function EventMonthsPage() {
  // 빌드 때 미리 만들면 그때의 달로 고정되므로, 요청이 올 때까지 기다린다.
  await connection();
  redirect(eventMonthPath(getCurrentEventMonth()));
}
