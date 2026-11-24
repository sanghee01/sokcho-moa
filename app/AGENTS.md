# app/AGENTS.md

`app/`의 라우트·페이지 규칙입니다. 저장소 전체 규칙은 [루트 AGENTS.md](../AGENTS.md), 화면 명세는 [.ai/DESIGN.md](../.ai/DESIGN.md)에 있습니다.
라우트 목록과 데이터 흐름은 [docs/architecture.md의 라우트](../docs/architecture.md#라우트)를 봅니다.

## 페이지의 역할

- `page.tsx`·`layout.tsx`는 데이터 함수를 부르고 `features/<도메인>/components`를 조립합니다. 필터·정렬·상태 계산 같은 도메인 로직은 `features/*/model`에 둡니다.
- 페이지에서 Supabase client를 직접 만들지 않고 `features/*/queries.ts`의 조회 함수를 부릅니다.
- `params`·`searchParams`는 zod나 `features/*/model`의 parse 함수로 검증한 뒤 씁니다(예: `parseEventFilters`).
- page props 타입은 Next.js 전역 helper `PageProps<"/route">`를 씁니다. 경로 문자열에서 `params` 타입이 만들어집니다.
- 여러 페이지가 같은 윗부분(배너 등)을 쓰면 route group의 공통 `layout.tsx`에 둡니다. 탭을 바꿀 때 페이지 전체가 다시 그려지지 않습니다(예: `app/(event-browse)/layout.tsx`).
- `export default`는 Next.js가 요구하는 파일(page, layout, loading, error, not-found, route 메타 파일)에만 씁니다. 같은 폴더의 보조 파일은 named export입니다.

## cacheComponents (2026-11-24 전환)

- 미리 만드는 화면에서 지금 시각(`new Date()`, model의 `now` 기본값)을 쓰는 서버 렌더는 `"use cache"`와 `cacheLife(PUBLIC_PAGE_CACHE_LIFE)`(`lib/public-cache-life.ts`)로 감쌉니다. 요청마다 그리는 행사 목록 묶음은 `await io()` 뒤에 씁니다(`app/(event-browse)/layout.tsx`).
- 본문은 Suspense로 감싸지 않고 다 그린 HTML을 보냅니다. 감싸면 본문이 푸터 뒤 숨김 영역으로 가 JS 없는 크롤러가 못 읽습니다. 루트 layout의 `instant = false`가 이를 사이트 전체에 허용하므로 페이지마다 다시 쓰지 않습니다. `searchParams`·`params`도 Suspense 밖에서 읽습니다.
- 떠난 화면은 지우지 않고 숨겨 두었다가 그대로 다시 보입니다(React `<Activity>`). 링크로 다시 들어올 때 처음 상태여야 하는 폼·입력창은 `components/layout/fresh-on-new-visit.tsx`로 감쌉니다.
- 공통 틀(`app/layout.tsx`)에서 `usePathname`을 읽는 메뉴·분석 부품은 Suspense로 감싸지 않습니다. 감싸면 첫 HTML에 현재 위치 표시가 빠진 메뉴가 들어갑니다.
- 요청마다 그리는 페이지 안의 `redirect()`·`notFound()`는 상태 코드 200 + 브라우저 이동·안내가 됩니다. 검색엔진·북마크에 307·308·404가 가야 하면 `proxy.ts`에서 먼저 처리합니다.
- 화면이 공통 틀(하단 탭·푸터·헤더)의 모양을 바꾸는 CSS는 `globals.css`의 `body:has(…)`로 쓰지 않고 `components/layout/visible-page-style.tsx`로 그 화면 안에 둡니다. `:has()`는 숨겨 둔 화면에도 적용됩니다(2026-11-24 리뷰).
- 검색 유입을 받는 정적 페이지(상세·목록·월별·지도·공지)는 `export const ensureStatic = "navigation"`으로 요청마다 그리는 일이 생기면 빌드가 멈추게 합니다. `generateStaticParams`는 `lib/static-params.ts`로 빈 배열을 막습니다.

## 관리자 페이지

- `app/admin/` 아래 각 `page.tsx`는 직접 `requireAdmin()`을 부릅니다. layout에서만 확인하지 않습니다(layout은 페이지 이동 때 다시 실행되지 않음).
- 관리자 쓰기는 페이지가 아니라 `features/<도메인>/admin/actions.ts`의 server action이 하고, action도 다시 인가합니다.

## 개인정보 처리방침

- `app/privacy/page.tsx`를 고치거나 새 수집 항목(알림 구독 등)을 더할 때, 법률 검토 전인 문구를 먼저 사용자에게 알리고 확인받습니다: 국외 이전 근거(법 제28조의8 제1항 제3호로 적음), 보유 기간 표현(2026-11-08 사용자 결정, 근거는 개인 메모 09 GA 검토 10절).

## 검증

- route를 추가·삭제하거나 정적 생성(`generateStaticParams`, `revalidate`)을 바꾸면 `pnpm test:e2e` 전체를 돌립니다.
