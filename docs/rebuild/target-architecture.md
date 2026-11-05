# 목표 구조

2026-11-05에 조사한 공식 문서와 오픈소스 프로젝트를 근거로 정한 속초모아의 목표 구조입니다.
1차 리팩토링은 이 구조로 코드를 옮기고 정리하는 작업입니다([1차 리팩토링](refactor-1.md)).

## 참고한 근거

| 출처 | 확인한 버전 | 가져온 것 |
| --- | --- | --- |
| Next.js 공식 문서 `data-security`, `server-actions`, `project-structure` | 16.2.12 번들 문서, 웹 문서 16.4 | 조회·쓰기를 `server-only` 모듈(Data Access Layer)에 두고 action은 얇게. action마다 검증·인가. 쓰기 직후 본인 변경을 보여 줄 때 `updateTag` |
| Supabase 공식 문서 `auth/server-side/nextjs`, `api-keys`, `generating-types`, `database/testing` | 2026-11 | 요청마다 쿠키로 서버 client 생성, admin(secret key) client 분리, `supabase gen types`, pgTAP DB 테스트, 새 키 이름 `SUPABASE_SECRET_KEY` |
| `vercel/next.js` `examples/with-supabase` | 6100e81e31 | `lib/supabase/` 파일 하나에 client 하나, 루트 `proxy.ts`로 세션 갱신 |
| `vercel/chatbot` | a8989b522f | `server-only` 조회 모듈, 사용자에게 보여 줄 오류와 로그용 원인 분리 |
| `nextjs/saas-starter` | 6e33e58b1e | 직접 만든 작은 action 검증 helper, `useActionState` 폼 |
| `alan2207/bulletproof-react` | 9506629ed0 | `features/<도메인>` 묶음, `app → features → 공용` 한 방향 의존 |
| `midday-ai/midday`, `dubinc/dub` | 51587319f2, 6b463b4bdd | 조회(queries)와 쓰기(mutations·actions) 구분, 로컬 실제 DB로 테스트하고 원격 DB에서는 테스트 실행 거부 |

조사에서 수렴하지 않은 것: 서버 캐시 전략. 공개 콘텐츠를 서버에서 tag로 캐시하는 사례는 표본에 없었고,
Next.js 문서는 "배포가 바뀌어도 유지돼야 하는 non-fetch 데이터는 `unstable_cache`를 계속 써도 된다"고 적습니다.
그래서 캐시 모델(Cache Components) 전환은 1차에서 하지 않습니다.

## 폴더와 규칙

폴더마다 규칙 하나를 말할 수 있게 나눕니다.

```text
app/                 URL 하나에 대응하는 것만. 데이터 함수 호출과 feature 컴포넌트 조립
features/<도메인>/   한 도메인의 규칙·조회·쓰기·화면
  model/             순수 함수와 타입. Supabase·Next.js를 모름. 단위 테스트 대상
  queries.ts         import "server-only". 조회(DAL)
  actions.ts         "use server". 검증 → 인가 → 쓰기 → 캐시 무효화. 얇게
  schemas.ts         zod 입력 schema. 폼과 action이 같은 타입을 씀
  cache.ts           이 도메인의 cache tag와 무효화 경로(원본 한 곳)
  components/        이 도메인의 화면 조각
  admin/             관리자 전용 조회·쓰기·화면(같은 규칙)
components/          2개 이상 feature가 쓰는 UI만 (ui/, layout/, admin/, analytics/)
lib/                 도메인을 모르는 인프라 (supabase, env, auth, rate-limit, seo, analytics)
supabase/            migrations, seed.sql, config.toml, tests(pgTAP), rollbacks
tests/               unit/(Vitest), e2e/(Playwright)
```

도메인은 `events`(행사 탐색·상세·관리), `places`(주변 명소), `reports`(행사 제보), `feedback`(서비스 의견),
`auth`(관리자 로그인)입니다.

### 의존 방향

- `app` → `features` → `components`, `lib`. 반대 방향 import는 하지 않습니다.
- feature끼리는 다른 feature의 `model`(타입·순수 함수)만 import합니다. 화면·조회·action을 섞어야 하면 `app`에서 조립합니다.
- `lib`은 `features`를 import하지 않습니다.

### Supabase client 세 종류

| 파일 | 키 | DB 역할 | 언제 쓰나 |
| --- | --- | --- | --- |
| `lib/supabase/public.ts` | publishable, 세션 없음 | `anon` | 캐시되는 공개 조회. 캐시 안에서는 쿠키를 읽을 수 없어서 따로 둡니다 |
| `lib/supabase/server.ts` | publishable + 쿠키 | 로그인하면 `authenticated` | 관리자 화면·쓰기, 로그인. 권한은 RLS와 `is_admin()`이 다시 검사합니다 |
| `lib/supabase/admin.ts` | secret | `service_role`(RLS 우회) | 방문자 제보·의견 저장, 요청 제한처럼 RLS 밖에서 서버 코드가 검증을 책임지는 곳만 |

세 파일 모두 `import "server-only"`입니다. 브라우저는 Supabase를 직접 부르지 않습니다.

### 1차에서 하지 않는 것(과설계)

| 하지 않는 것 | 이유 |
| --- | --- |
| 모노레포·`packages/*` | 앱이 하나이고 코드를 공유할 다른 앱이 없습니다 |
| tRPC·React Query·SWR | 공개 화면은 서버 컴포넌트와 서버 캐시로 충분합니다. 캐시 원본이 둘이 되면 설명해야 할 것만 늘어납니다 |
| `next-safe-action` 같은 action 라이브러리 | action이 10여 개라 30줄 helper로 충분하고, `useActionState` 구조를 유지할 수 있습니다 |
| ORM(Drizzle·Prisma) | Supabase client + RLS + 생성 타입으로 같은 효과를 얻습니다. ORM 연결은 RLS를 우회할 수 있습니다 |
| Cache Components 전환 | Vercel에서 기본 `use cache`는 인스턴스 메모리라, 배포를 넘어 유지되는 지금 방식보다 공개 목록 캐시가 약해집니다. 2차 후보입니다 |
