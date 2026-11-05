import "server-only";
import { adminActionFailed, type AdminActionState } from "@/lib/action-state";
import type { SessionSupabaseClient } from "@/lib/supabase/server";
import { extractSourceExternalId } from "@/features/events/model/source-url";

/**
 * 관리자가 삭제한 행사는 수집기로 다시 들어오지 않게 "재수집 제외" 기록이 남는다.
 * DB trigger가 같은 행사의 저장을 거부하지만, 이미지 업로드 전에 미리 확인해 이유를 알려 준다.
 */
export const EXCLUDED_EVENT_MESSAGE =
  "이 행사는 이전에 삭제되어 재수집 제외 중입니다. 관리자 대시보드에서 먼저 재수집을 허용해 주세요.";

/** DB trigger가 재수집 제외로 저장을 거부했을 때의 오류인지 판별한다. */
export function isEventCollectionExcludedError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("event_collection_excluded")
    || normalized.includes("event collection excluded")
    || message.includes("재수집 제외");
}

export async function findExclusionFailure(
  client: SessionSupabaseClient,
  input: { slug: string; sourceUrl: string },
): Promise<AdminActionState | null> {
  const { data, error } = await client.rpc("is_event_collection_excluded", {
    p_slug: input.slug,
    p_source_url: input.sourceUrl,
    // DB 함수가 빈 문자열을 null과 같이 처리한다(nullif(btrim(p_external_id), '')).
    p_external_id: extractSourceExternalId(input.sourceUrl) ?? "",
  });
  if (error) {
    console.error("Event collection exclusion check failed", error.message);
    return adminActionFailed("재수집 제외 목록을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  return data === true ? adminActionFailed(EXCLUDED_EVENT_MESSAGE) : null;
}
