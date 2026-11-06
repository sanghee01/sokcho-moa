# lib/AGENTS.md

도메인을 모르는 인프라 코드의 규칙입니다. 저장소 전체 규칙은 [루트 AGENTS.md](../AGENTS.md)에 있습니다.

## 무엇을 여기에 두나

- 특정 도메인(`Event`, `Place`)을 import하지 않는 코드만 둡니다. 도메인을 알면 `features/<도메인>/`에 둡니다.
- DB·비밀값에 닿는 모듈은 첫 줄에 `import "server-only"`를 둡니다(`supabase/*`, `env.server.ts`, `rate-limit.ts`, `public-submission.ts`, `auth/admin.ts`).

## 환경 변수

- `process.env`는 `env.ts`(공개 값)와 `env.server.ts`(비밀값)에서만 읽고, 다른 곳은 `getPublicEnv()`·server env 함수를 씁니다.
- 비밀값 이름에는 `NEXT_PUBLIC_`을 붙이지 않습니다. 붙이면 브라우저 번들에 들어갑니다.

## Supabase client 선택

브라우저는 Supabase를 직접 부르지 않습니다. 읽기는 서버 컴포넌트, 쓰기는 server action·route handler가 합니다.

| 함수 | 권한 | 쓰는 곳 |
| --- | --- | --- |
| `createPublicSupabaseClient` (`supabase/public.ts`) | `anon`, 세션 없음 | 캐시되는 공개 조회 |
| `createSessionSupabaseClient` (`supabase/server.ts`) | 로그인한 사용자, RLS 적용 | 관리자 조회·쓰기, 로그인 |
| `createAdminSupabaseClient` (`supabase/admin.ts`) | `service_role`, **RLS 우회** | 방문자 제보·의견 저장, 요청 제한, 조회수 |

- `createAdminSupabaseClient`는 RLS로 표현할 수 없는 쓰기에만 쓰고, 쓰는 곳에 이유를 주석으로 남깁니다. 이 client를 쓰는 코드에서는 서버 코드가 유일한 권한 검사입니다.
- 권한 판단에 `getSession()`을 쓰지 않습니다. 관리자 확인은 `auth/admin.ts`의 `requireAdmin()`·`getAdminIdentity()`(요청마다 한 번, `React.cache`)를 씁니다.
- `supabase/database.types.ts`는 생성 파일입니다. 직접 고치지 않고 migration을 바꾼 뒤 `pnpm db:types`로 다시 만듭니다.
