// 관리자 작업이 끝난 뒤 이동할 주소의 결과 표시(?result=)와 안내 문구를 이 한 곳에서 관리한다.
// 예전에는 saved·deleted·released·created마다 주소 이름과 문구가 action과 페이지에 흩어져 있었다(2026-11-07).
const adminResultMessages = {
  "event-created": "새 행사를 검수 대기로 등록했습니다.",
  "event-updated": "행사 정보를 수정했습니다.",
  "event-imported": "검수 대기 행사로 등록했습니다.",
  "event-deleted": "행사를 삭제하고 재수집에서 제외했습니다.",
  "exclusion-released": "행사의 재수집 제외를 해제했습니다.",
  "place-saved": "명소 정보를 저장했습니다.",
  "place-deleted": "명소를 삭제했습니다.",
} as const;

export type AdminResult = keyof typeof adminResultMessages;

/** 이동할 관리자 주소에 결과를 붙인다. 주소에 이미 있는 query(?tab= 등)는 그대로 둔다. */
export function adminResultHref(path: string, result: AdminResult) {
  const url = new URL(path, "http://admin.local");
  url.searchParams.set("result", result);
  return `${url.pathname}${url.search}`;
}

/** 주소의 result 값으로 안내 문구를 고른다. 모르는 값이면 아무것도 보여 주지 않는다. */
export function getAdminResultMessage(value?: string) {
  if (!value || !Object.hasOwn(adminResultMessages, value)) return undefined;
  return adminResultMessages[value as AdminResult];
}
