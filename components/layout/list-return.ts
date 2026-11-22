// 상세의 "목록으로 돌아가기"가 브라우저 뒤로 가기로 돌아갈지 정하는 기록(.ai/DESIGN.md BackToListLink).
// 목록에서 상세로 들어왔으면 뒤로 가기가 들어오기 전 화면(같은 분류·탭, 스크롤 위치, 지도 카드와 확대 수준)을 그대로 되살린다.
// 검색 결과 밖에서 바로 들어왔거나 상세에서 다른 상세로 왔으면 뒤로 가기가 사이트 밖이나 다른 상세로 가므로, 정해 둔 목록으로 간다(2026-11-22 사용자 결정).

/** 기록 칸(history.state)에 남기는 표시. 처음 들어올 때 정해 두어, 앞으로 가기로 다시 와도 같은 답을 낸다. Next.js는 뒤로·앞으로 가기 때 이 값을 그대로 둔다. */
const RETURNS_TO_LIST_STATE_KEY = "sokchoMoaReturnsToList";

/** 돌아갈 만한 목록 화면. 상세(/events/…, /places/이름, /notices/…)와 안내 페이지는 넣지 않는다. */
const LIST_PATHNAME_PATTERNS = [
  /^\/$/,
  /^\/topics\/[^/]+$/,
  /^\/months(\/[^/]+){0,2}$/,
  /^\/map$/,
  /^\/search$/,
  /^\/places$/,
  /^\/places\/category\/[^/]+$/,
];

// 이 탭에서 본 페이지 주소(경로만). 새로 고치면 비어, 그때는 정해 둔 목록으로 간다.
let previousPathname: string | null = null;
let currentPathname: string | null = null;

/** 페이지를 옮길 때마다 부른다(components/layout/pathname-recorder.tsx). */
export function recordPathname(pathname: string) {
  if (pathname === currentPathname) return;
  previousPathname = currentPathname;
  currentPathname = pathname;
}

export function isListPathname(pathname: string) {
  return LIST_PATHNAME_PATTERNS.some((pattern) => pattern.test(pathname));
}

function isListReferrer(referrer: string) {
  if (referrer === "") return false;
  try {
    const url = new URL(referrer);
    return url.origin === window.location.origin && isListPathname(url.pathname);
  } catch {
    return false;
  }
}

/**
 * 이 상세 칸이 목록에서 들어온 칸인지. 상세가 화면에 붙을 때 부른다.
 * 경로 기록(recordPathname)은 상세보다 먼저 또는 나중에 갱신될 수 있어(effect 순서), 이미 이 상세로 바뀌었으면 그 앞 주소를 본다.
 */
export function resolveReturnsToList(pathname: string) {
  const state: unknown = window.history.state;
  const stateObject = typeof state === "object" && state !== null ? state : {};
  if (RETURNS_TO_LIST_STATE_KEY in stateObject && typeof stateObject[RETURNS_TO_LIST_STATE_KEY] === "boolean") {
    return stateObject[RETURNS_TO_LIST_STATE_KEY];
  }
  const cameFrom = currentPathname === pathname ? previousPathname : currentPathname;
  // 이 문서의 첫 페이지면(새로 불러옴) 앞 페이지를 경로 기록으로 알 수 없다. 페이지가 다 뜨기 전에 목록의 링크를 누르면
  // 브라우저가 문서를 새로 불러오는데, 그때는 같은 사이트의 앞 주소(document.referrer)로 판단한다(2026-11-22).
  // 목록을 새 탭으로 열었으면 앞 주소는 목록이어도 뒤로 갈 칸이 없다(기록 길이 1).
  const hasPreviousEntry = window.history.length > 1;
  const returnsToList = hasPreviousEntry && (cameFrom !== null ? isListPathname(cameFrom) : isListReferrer(document.referrer));
  // 주소 없이 바꾸면 Next.js는 주소·화면을 건드리지 않고 기록 칸의 값만 바꾼다.
  window.history.replaceState({ ...stateObject, [RETURNS_TO_LIST_STATE_KEY]: returnsToList }, "");
  return returnsToList;
}
