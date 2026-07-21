export function getAdminDashboardFeedback({ saved, deleted }: { saved?: string; deleted?: string }) {
  if (saved === "event-created") return "새 행사를 검수 대기로 등록했습니다.";
  if (saved === "event-updated") return "행사 정보를 수정했습니다.";
  if (deleted === "event") return "행사를 삭제했습니다.";
  if (deleted === "place") return "명소를 삭제했습니다.";
  return undefined;
}
