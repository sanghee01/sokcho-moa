# 개발 환경

속초모아를 로컬에서 실행하고 검증하는 방법입니다. 서비스 소개는 [README](../README.md), 코드 구조는 [architecture.md](architecture.md)에 있습니다.

## 로컬 실행

Node.js 22([.nvmrc](../.nvmrc))와 pnpm 9를 사용합니다. 로컬 Supabase를 Docker로 실행하므로 Docker가 필요합니다.

```bash
pnpm install
pnpm db:start
```

```bash
cp .env.example .env.local
```

`.env.local`에는 `pnpm exec supabase status`가 출력하는 로컬 값을 넣습니다. 변수별 설명은 [.env.example](../.env.example)에 있습니다.

```bash
pnpm db:reset
pnpm dev
```

`pnpm db:reset`은 migration을 모두 다시 적용하고 [supabase/seed.sql](../supabase/seed.sql)의 샘플 행사와 로컬 전용 관리자 계정을 넣습니다.

## 검증

CI(`.github/workflows/ci.yml`)와 같은 검사입니다.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm db:test
pnpm places:check
pnpm test:e2e
pnpm build
```

`seed.sql`의 행사 날짜는 `now()` 기준이라 시간이 지나면 샘플 행사가 끝나 목록 순서가 바뀝니다.
E2E가 목록·정렬·마감 탭에서 무더기로 실패하면 먼저 `pnpm db:reset`으로 샘플 데이터를 새로 넣고 다시 실행합니다(2026-11-17, 하루 지난 seed로 16개 실패).

## 공개 데이터와 라이선스

소스 코드는 [MIT License](../LICENSE)로 배포합니다.

외부 기관의 행사·명소 데이터, 제3자 이미지·로고는 MIT License에 포함하지 않습니다. 각 원출처의 이용 조건과 출처표시 요구사항을 따릅니다.
