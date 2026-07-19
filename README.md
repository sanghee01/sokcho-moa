# 속초모아

속초의 공연·축제·체험·교육 정보를 날짜, 신청 가능 여부, 요금, 대상, 카테고리로 찾아보고 원문과 주변 명소까지 확인하는 운영용 MVP입니다. 공개 화면은 서버 렌더링과 ISR을 사용하고, 관리자는 Supabase Auth와 `admin_users` 허용 목록을 통과한 한 명의 운영자를 전제로 합니다.

## 기술 구성

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Postgres, Auth, Storage, RLS
- Zod, Vitest, Playwright
- Vercel 배포 기준

## 로컬 실행

Node.js 22와 pnpm 9를 사용합니다.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

기본 `NEXT_PUBLIC_DATA_MODE=demo`에서는 자격증명 없이 `http://localhost:3000`에서 명시적으로 표시된 샘플 8개를 볼 수 있습니다. 샘플은 실제 행사 정보가 아닙니다.

## 환경 변수

실제 키 이름과 기본값은 `.env.example`에 있습니다.

| 이름 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_DATA_MODE` | `demo` 또는 `supabase` |
| `NEXT_PUBLIC_SITE_URL` | canonical, sitemap, robots의 공개 기준 URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 브라우저와 서버의 RLS 적용 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 향후 서버 전용 자동 수집용 예약 값. 현재 앱 코드는 사용하지 않음 |
| `REVALIDATE_SECRET` | 외부 작업이 `POST /api/revalidate`를 호출할 때의 Bearer 비밀값 |

`SUPABASE_SERVICE_ROLE_KEY`와 `REVALIDATE_SECRET`에는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

## Supabase 연결

다음 단계는 Supabase Dashboard에서 운영자가 직접 수행합니다.

1. 새 프로젝트를 만들고 SQL Editor에서 `supabase/migrations/202607190001_initial_schema.sql`을 실행합니다.
2. 필요할 때만 `supabase/seed.sql`을 실행합니다. 이 파일의 행사는 모두 샘플이며 실제 운영 데이터로 간주하면 안 됩니다.
3. Authentication의 Users에서 이메일/비밀번호 운영자 한 명을 만듭니다.
4. SQL Editor에서 아래 값을 실제 Auth 사용자 값으로 바꿔 허용 목록에 넣습니다.

```sql
insert into public.admin_users (user_id, email)
values ('AUTH_USER_UUID', 'operator@example.com');
```

5. Project Settings > API의 Project URL과 publishable key를 `.env.local`에 넣고 `NEXT_PUBLIC_DATA_MODE=supabase`로 바꿉니다.
6. `/admin/login`에서 로그인한 뒤 `/admin`에서 행사와 명소를 관리합니다.

Migration은 공개된 행사와 명소만 익명 읽기를 허용하고, 쓰기는 로그인한 `admin_users`에만 허용합니다. `event-images` 버킷은 JPG, PNG, WebP와 5MB 제한을 적용합니다. 공개 전 행사에는 시작일과 `published_at`이 필요합니다.

이 저장소에서는 실제 Supabase 프로젝트 생성, migration 실행, Auth 사용자 생성, Storage 업로드를 검증하지 않았습니다. 자격증명이 있는 환경에서 위 순서와 RLS 거부/허용 동작을 별도로 확인해야 합니다.

## 운영 흐름

- `/admin/events/new`: 출처 URL과 확인 날짜를 포함해 행사를 검수 대기로 등록
- `/admin/events/[id]`: 수정, 이미지 업로드, 공개, 반려, 삭제
- `/admin/places/new`, `/admin/places/[id]`: 주변 명소 등록과 관리
- `/admin/import`: `EventCandidate` JSON을 추측 없는 검수 대기 행사로 등록

공개나 수정 뒤 목록, 상세, sitemap 경로가 재검증됩니다. 외부 수집 작업이 추가 재검증해야 하면 다음 요청을 보냅니다.

```bash
curl -X POST https://YOUR_DOMAIN/api/revalidate \
  -H "Authorization: Bearer YOUR_REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"slug":"event-slug"}'
```

`slug`를 빼면 목록과 sitemap만 갱신합니다.

## 향후 하루 한 번 AI 수집 연결

완전 자동 공개는 범위 밖입니다. 하루 한 번 실행하는 수집기는 공식 원문에서 확인한 값만 `EventCandidate` 형태로 만들고, 확인 불가 값은 `null`로 유지해야 합니다. 현재 구현된 정확한 연결 지점은 다음 네 파일입니다.

- 후보 계약: `lib/domain/event.ts`의 `eventCandidateSchema`
- JSON 입력 검증: `lib/admin/schemas.ts`의 `candidateJsonSchema`
- 검수 대기 저장과 출처 이력: `lib/actions/admin.ts`의 `importEventCandidateAction`
- 운영자 입력 화면: `app/admin/import/page.tsx`

따라서 첫 운영 단계에서는 일일 작업의 JSON 결과를 `/admin/import`에 붙여넣고 운영자가 보완·공개합니다. 무인 스케줄러를 추가할 때도 같은 Zod 계약과 pending 저장 규칙을 공유해야 하며, service role은 새 서버 전용 경계에서만 읽어야 합니다. 현재 저장소에는 무인 수집기나 스케줄이 없고 원격 실행도 검증하지 않았습니다.

## 검증

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

Playwright는 demo mode로 개발 서버를 띄우고 데스크톱 Chrome과 Pixel 7 뷰포트에서 목록 → 가족 필터 → 상세 → 원문 링크 → 주변 명소 4곳을 검사합니다. 원문 링크는 로컬 DOM의 접근 가능한 이름·`href`·`target`과 새 탭 생성 이벤트로 검증합니다. 외부 사이트 응답에는 의존하지 않도록 원문 네트워크 요청은 테스트에서 중단하며, 새 탭이 외부 문서를 실제로 불러왔는지는 단언하지 않습니다.

## Vercel 배포

1. 저장소를 Vercel 프로젝트로 가져옵니다.
2. Framework Preset은 Next.js, Install Command는 `pnpm install`, Build Command는 `pnpm build`를 사용합니다.
3. Production 환경 변수에 `.env.example`의 이름을 등록합니다. `NEXT_PUBLIC_DATA_MODE=supabase`, `NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN`을 사용하고 Supabase URL, publishable key, `REVALIDATE_SECRET`을 넣습니다.
4. 배포 후 `/`, 필터 URL, 샘플이 아닌 공개 행사 상세, `/sitemap.xml`, `/robots.txt`, `/admin/login`을 확인합니다.
5. 운영자로 로그인해 pending 행사 등록, 공개, 수정, 이미지 업로드, 반려와 공개 페이지 갱신을 확인합니다.

이 저장소에서는 Vercel 프로젝트 생성, 환경 변수 등록, 실제 배포, 도메인·Auth 리디렉션 검증을 수행하지 않았습니다.

## 릴리스 체크리스트

- 샘플 데이터가 실제 운영 정보와 명확히 구분되는가
- 원문, 신청, 지도 링크가 새 창 안내와 함께 올바른 대상으로 가는가
- 모바일과 데스크톱에서 필터, 카드, 표, 폼이 가로로 잘리지 않는가
- 키보드 초점, 본문 건너뛰기, 이미지 대체 텍스트, 빈/오류/로딩 상태가 보이는가
- 비운영자가 관리자 쓰기와 Storage 변경을 할 수 없는가
- `SUPABASE_SERVICE_ROLE_KEY`가 브라우저 번들 또는 `NEXT_PUBLIC_` 변수에 없는가
- lint, typecheck, unit, E2E, build가 모두 통과하는가
