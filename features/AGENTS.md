# features/AGENTS.md

도메인 폴더(`features/<도메인>/`)의 규칙입니다. 저장소 전체 규칙은 [루트 AGENTS.md](../AGENTS.md)에 있습니다.
도메인별 파일 구성과 데이터 흐름은 [docs/architecture.md](../docs/architecture.md#데이터-흐름)를 봅니다.

## 폴더 구성

| 위치 | 담는 것 |
| --- | --- |
| `model/` | 타입, 상태 계산, 필터·정렬, 표시용 변환. 순수 함수 |
| `queries.ts` | 공개 조회. 첫 줄 `import "server-only"` |
| `actions.ts` | 방문자 server action. 첫 줄 `"use server"` |
| `schemas.ts` | zod 입력 검증 |
| `cache.ts` | 캐시 tag와 만료 함수 |
| `mappers.ts` | DB 행 → 도메인 타입 변환 |
| `components/` | 이 도메인만 쓰는 화면 부품. 화면 규칙은 [.ai/DESIGN.md](../.ai/DESIGN.md) |
| `admin/` | 관리자 queries·actions·components |

## model (순수 로직)

- 화면에 보이는 상태(종료, 신청 마감, NEW, 배지)는 컴포넌트가 아니라 model 함수로 계산합니다(예: `selectEventBadges`, `isRecentlyPublished`).
- "지금"에 따라 결과가 바뀌는 함수는 `now = new Date()`를 마지막 인자로 받습니다. test는 고정된 `now`를 넘깁니다.
- 날짜 비교·표시는 `Asia/Seoul` 기준 helper(`getKoreanParts`, `features/events/model/format.ts`)로 합니다. `toLocaleDateString()`·`getDate()`를 직접 쓰지 않습니다(서버와 브라우저 시간대가 달라 hydration이 어긋남).
- model을 바꾸면 `pnpm test` 전체를 돌리고, 날짜 로직은 자정·월말·KST↔UTC 경계 test를 확인합니다.

## 조회와 캐시

- 공개 조회는 `createPublicSupabaseClient`로 도메인 전체 목록 하나를 `unstable_cache`와 tag로 캐시하고, 필터·정렬은 model 함수로 메모리에서 합니다(예: `getAllPublicEvents` → `filterEvents`·`sortEvents`).
- 캐시 tag와 만료 함수는 도메인의 `cache.ts` 한 곳에 둡니다. 사람이 저장한 뒤에는 `updateTag`(즉시), 외부 수집기 알림에는 `revalidateTag(tag, "max")`를 씁니다.
- 관리자 조회는 `createSessionSupabaseClient`를 씁니다. client 선택 기준은 [lib/AGENTS.md](../lib/AGENTS.md)에 있습니다.

## Server action

- 관리자 action 순서: `requireAdmin()` → zod 검증 → 쓰기 → 캐시 만료. 페이지에서 한 인가는 action에 이어지지 않으므로 action마다 다시 합니다.
- 방문자 action 순서: 봇 확인(`isBotSubmission`) → zod 검증 → 요청 제한(`openPublicSubmission`) → 쓰기.
- 예상한 실패(검증 실패, 권한 없음, 저장 실패)는 throw하지 않고 `lib/action-state.ts`의 helper로 반환합니다. 폼 action은 `actionFailed`·`adminActionFailed`,
  버튼 action은 `buttonActionFailed`(`ButtonActionResult`)입니다. throw는 예상하지 못한 오류에만 씁니다.
- DB 오류 원문은 사용자에게 보여 주지 않고 `console.error`로 서버 로그에만 남깁니다. action은 UI에 필요한 값만 돌려줍니다.
