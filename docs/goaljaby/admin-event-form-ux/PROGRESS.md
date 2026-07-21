## Goal 검토 요약

- 목표: 기술 메타데이터 입력과 링크 중복을 없애고 필수 정보·공개 결과가 명확한 행사 작성/수정 흐름을 만든다.
- 마일스톤: 저장 계약·데이터 보존 → 폼 정보 구조 → 여러 줄 운영일정 → 공개 링크·완료 이동 → 전체 회귀·시각 검증.
- 필수 검증: lint, typecheck, 94개 이상 unit, build, desktop/mobile E2E, 신규·수정 저장 전후 데이터 보존, 두 viewport 시각 확인.
- scope 잠금: DB/API/지도/장소 폼으로 확장하지 않고 기존 slug·위치 메타데이터·`official_url`과 사용자 파일을 보존한다.

---

# PROGRESS

## 현재 골

속초모아 운영자가 기술 메타데이터를 직접 다루지 않고도 필수 정보와 공개 화면의 노출 결과를 이해하며 행사를 작성·수정하고, 완료 후 대시보드로 자연스럽게 돌아가게 한다.

## 현재 마일스톤

완료 — 모든 마일스톤과 필수 검증 통과

## Goal 시작 기록

- 시작 시각: 2026-07-21T14:24:45+09:00
- 실행 환경: codex
- objective 길이: 872자

## 완료

- `goaljaby-codex` 지침과 필수 reference 전체 확인
- 저장소의 관리자 폼, 저장 action, Zod schema, DB schema, 공개 상세 CTA·관련 링크, 테스트·검증 명령 확인
- 작업 유형 `ui`, 검증 엄격도 `standard`, artifact_only `false` 확정
- 기준선 `pnpm lint` 통과
- 기준선 `pnpm typecheck` 통과
- 기준선 `pnpm test` 통과: 18 files, 94 tests
- 기준선 `pnpm build` 정상 권한 재실행 통과: 38개 static/dynamic route 생성
- Goaljaby 운영 계약 초안 생성
- 기준선 검사 중 감지한 사용자 동시 변경 `components/admin/admin-action-form.tsx`를 보존 대상으로 기록
- Goal 시작 직전 감지한 사용자 소유 `.tmp-ga-route-check.mjs`를 추가 보존 대상으로 기록
- 마일스톤 1 완료: UUID 기반 신규 slug 자동 생성과 수정 slug 유지 경로 구현
- 마일스톤 1 완료: 수정 payload에서 위치 좌표·위치 근거·위치 확인 시각을 제외해 기존 DB 값 보존
- 마일스톤 1 완료: 수동 폼의 `official_url` 갱신을 제거하고 레거시 값이 명시적으로 들어온 별도 경로만 조건부 보존
- 마일스톤 1 완료: 행사와 출처에 동일한 서버 확인 시각 기록
- 마일스톤 1 targeted 검증 통과: typecheck, 관련 5 files 23 tests
- 관리자 폼 5개 의미 구역, 접근 가능한 필수 표시, 기술 필드 제거, 공개 버튼 설명 구현
- 운영일정 textarea와 줄바꿈 보존 포맷터·공개 표현 구현
- 공개 CTA를 행사 안내·조건부 신청·자동 공유로 정리하고 중복 관련 링크 제거
- 작성/수정 대시보드 redirect와 성공 메시지 helper 구현
- 중간 전체 검증 통과: lint, typecheck, 19 files 99 tests
- 마일스톤 2 완료: 작성·수정 폼의 5개 구역, 필수 표시, 참여 대상 1개 이상 브라우저 검증, CTA 설명을 desktop/mobile E2E로 확인
- 마일스톤 3 완료: 운영일정 textarea 입력·재수정과 줄 단위 포맷터, 공개 `whitespace-pre-line` 표현을 unit/E2E/스크린샷으로 확인
- 마일스톤 4 완료: 공개 CTA와 중복 링크 제거, 작성/수정 redirect·대시보드 메시지를 unit 및 desktop/mobile E2E로 확인
- targeted 관리자 폼 E2E 6/6 통과, 공개 CTA E2E 2/2 통과
- 신규·수정 폼과 공개 상세의 desktop/mobile 스크린샷을 `view_image`로 직접 검사해 겹침·잘림·가로 넘침 없음 확인
- 마일스톤 5 완료: lint, typecheck, 19 files 99 unit, production build 39 routes, desktop/mobile E2E 51 passed·기존 device 조건 1 skipped
- `git diff --check`, acceptance 9/9 mapping, DB schema·public API 무변경 scope 감사 통과
- 사용자 동시 변경 `components/admin/admin-action-form.tsx`, `lib/domain/source.ts`, `tests/source.test.ts`와 미추적 `design-qa.md`, `output/` 보존

## 마지막 검증 결과

```text
2026-07-21 Goal 시작 전 기준선
- pnpm lint: 통과
- pnpm typecheck: 통과
- pnpm test: 통과 (18 files, 94 tests)
- pnpm build: 샌드박스 포트 제한으로 최초 실패 후 정상 권한 재실행 통과
- pnpm test:e2e: 제품 실행 전 중단 — 사용자 소유 Next dev PID 45777의 저장소 잠금으로 Playwright webServer 시작 불가
- 제품 파일은 변경하지 않았고 사용자 소유 design-qa.md, output/은 건드리지 않음
- build가 자동 변경한 next-env.d.ts는 원래 기준선으로 복원하고 사용자 동시 변경 admin-action-form.tsx는 보존함
- 2026-07-21 중간 검증: pnpm lint 통과, pnpm typecheck 통과, pnpm test 통과 (19 files, 99 tests)
- 2026-07-21T14:41:29+09:00 최종 검증: pnpm lint·typecheck·test·build·test:e2e·git diff --check 모두 통과
- production build: 39개 static/dynamic route 생성
- full Playwright: 51 passed, 1 skipped (기존 모바일 전용 검사의 desktop 조건 skip이며 이번 작업에서 skip 추가 없음)
- 시각 증거: 신규 폼·수정 폼·공개 상세 desktop/mobile full-page screenshot 직접 검사 통과
- scope 감사: supabase migration과 app/api 변경 0건
```

## 실패 시도

| 시도 | 변경 | 결과 | 배운 점 |
| --- | --- | --- | --- |
| 1 | 샌드박스에서 `pnpm build` 기준선 실행 | Turbopack의 로컬 포트 bind가 `EPERM`으로 제품 컴파일 전 중단 | 같은 명령을 정상 권한으로 재실행해 통과함 |
| 2 | 샌드박스에서 `pnpm test:e2e` 기준선 실행 | Playwright webServer의 127.0.0.1:3100 bind가 `EPERM`으로 시작 전 중단 | 정상 권한 실행이 필요함 |
| 3 | 정상 권한으로 `pnpm test:e2e` 재실행 | 사용자 소유 Next dev PID 45777이 같은 저장소를 사용 중이라 새 서버 시작 전 중단 | 기존 프로세스를 임의 종료하지 않고 Goal 완료 전 재실행해야 함 |
| 4 | 새 폼·공개 CTA targeted E2E 실행 | 같은 PID 45777의 Next 저장소 잠금으로 Playwright webServer 시작 전 중단 | 정적 검증을 먼저 끝내고 사용자 승인 후 해당 프로세스를 종료하거나 안전한 실행 환경을 확보해야 함 |
| 5 | 수정 폼 targeted E2E의 slug 보존 검사 | 제품에는 세 폼 모두 같은 hidden slug가 있어 locator strict mode만 실패 | 저장 form 첫 번째 범위로 locator를 좁혀 desktop/mobile 6/6 재실행 통과 |

## 현재 가장 안정적인 상태

모든 마일스톤이 구현되고 자동·수동·시각 검증을 통과했다. 기술 메타데이터는 폼에서 제거됐고 update payload가 기존 위치·공식 URL 값을 덮어쓰지 않으며, 공개 CTA와 완료 이동 계약도 회귀 테스트로 고정됐다.

## 다음 단계

없음 — Goal 완료 처리.

## 리스크 / 블로커

- 현재 구현의 update payload는 숨긴 필드를 그대로 null로 보내면 기존 좌표·위치 근거·`official_url`을 지울 수 있으므로, 필드를 숨기기 전에 update payload에서 명시적으로 제외해야 한다.
- `formatOperatingSchedule`이 현재 모든 공백을 한 줄로 합치므로 textarea 변경만으로는 AC-7이 충족되지 않는다.
- 없음. 실제 운영 DB 데이터는 변경하지 않았으며 데이터 보존은 action이 사용하는 payload helper 단위 테스트와 수정 폼 E2E로 검증했다.
- `components/admin/admin-action-form.tsx`에는 이 계약 작성 중 사용자가 추가한 오류 dismiss 동작이 있으므로 이후 폼 변경은 이를 되돌리지 않고 호환해야 한다.

## 인수인계 메모

Goaljaby Codex가 생성한 운영 계약이다. 각 마일스톤과 실패 후 업데이트한다. 사용자 승인 전 `create_goal`을 호출하지 않는다.
