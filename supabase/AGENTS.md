# supabase/AGENTS.md

DB schema, 권한, DB test의 규칙입니다. 운영 DB 안전 규칙은 [루트 AGENTS.md의 운영 데이터](../AGENTS.md#운영-데이터)가 원본이고,
현재 테이블 권한 표는 [docs/architecture.md의 테이블과 권한](../docs/architecture.md#테이블과-권한)에 있습니다.

## Migration

- schema 변경은 `pnpm exec supabase migration new <이름>`으로 새 파일을 만들어 추가합니다. 이미 적용된 migration 파일은 고치지 않습니다.
- 새 migration에는 같은 이름의 rollback SQL을 `rollbacks/`에 둡니다. 되돌릴 수 없는 변경(데이터 삭제, 정보가 사라지는 형 변환)이면 이유와 백업 방법을 적습니다.
- 운영 적용은 사용자가 합니다. 적용 뒤 원격 migration 이력이 로컬 파일과 같은지 확인합니다.
- `seed.sql`은 로컬 전용입니다(로컬 관리자 계정과 `demo-` 샘플 행사).

## RLS 정책

- 새 table은 같은 migration에서 RLS를 켜고 policy와 grant를 명시합니다.
- 정책은 작업(`select`·`insert`·`update`·`delete`)별로 나눠 쓰고 `for all`을 쓰지 않습니다. 정책은 그 역할이 grant를 가진 작업에만 만듭니다.
- 정책에는 `to` 역할(`anon`, `authenticated`)을 반드시 적습니다.
- 정책 안의 `auth.uid()`·`public.is_admin()`은 `(select …)`로 감싸 행마다 다시 계산되지 않게 합니다.

## DB 함수

- 기본은 `security invoker`입니다. `security definer`가 필요하면 `set search_path = ''`를 붙이고 모든 이름에 스키마를 붙입니다(`public.events`).
- 새 함수는 `public`·`anon`의 `execute`를 회수하고 필요한 역할에만 다시 줍니다.

## pgTAP test (`tests/database/`)

- RLS·grant·RPC를 추가하거나 바꾸면 허용되는 경우와 거부되는 경우를 각각 하나 이상 test로 추가합니다. RLS 거부는 오류 없이 0행이 되어 눈에 띄지 않습니다.
- 검증 순서: `pnpm db:reset` → `pnpm db:test` → `pnpm db:types` → 생성 타입 diff 확인.
