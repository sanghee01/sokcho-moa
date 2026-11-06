# app/AGENTS.md

`app/`의 라우트·페이지 규칙입니다. 저장소 전체 규칙은 [루트 AGENTS.md](../AGENTS.md), 화면 명세는 [.ai/DESIGN.md](../.ai/DESIGN.md)에 있습니다.
라우트 목록과 데이터 흐름은 [docs/architecture.md의 라우트](../docs/architecture.md#라우트)를 봅니다.

## 페이지의 역할

- `page.tsx`·`layout.tsx`는 데이터 함수를 부르고 `features/<도메인>/components`를 조립합니다. 필터·정렬·상태 계산 같은 도메인 로직은 `features/*/model`에 둡니다.
- 페이지에서 Supabase client를 직접 만들지 않고 `features/*/queries.ts`의 조회 함수를 부릅니다.
- `params`·`searchParams`는 zod나 `features/*/model`의 parse 함수로 검증한 뒤 씁니다(예: `parseEventFilters`).
- page props 타입은 Next.js 전역 helper `PageProps<"/route">`를 씁니다. 경로 문자열에서 `params` 타입이 만들어집니다.
- 여러 페이지가 같은 윗부분(탭·배너)을 쓰면 route group의 공통 `layout.tsx`에 둡니다. 탭을 바꿀 때 페이지 전체가 다시 그려지지 않습니다(예: `app/(event-browse)/layout.tsx`).
- `export default`는 Next.js가 요구하는 파일(page, layout, loading, error, not-found, route 메타 파일)에만 씁니다. 같은 폴더의 보조 파일은 named export입니다.

## 관리자 페이지

- `app/admin/` 아래 각 `page.tsx`는 직접 `requireAdmin()`을 부릅니다. layout에서만 확인하지 않습니다(layout은 페이지 이동 때 다시 실행되지 않음).
- 관리자 쓰기는 페이지가 아니라 `features/<도메인>/admin/actions.ts`의 server action이 하고, action도 다시 인가합니다.

## 검증

- route를 추가·삭제하거나 정적 생성(`generateStaticParams`, `revalidate`)을 바꾸면 `pnpm test:e2e` 전체를 돌립니다.
