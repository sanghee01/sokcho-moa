# VALIDATION — 행사 작성·수정 폼 UX 개선

## 필수 검증

Goal 완료 전 반드시 실행한다.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
git diff --check
```

기준선은 2026-07-21에 `pnpm lint`, `pnpm typecheck`, `pnpm test`(18 files, 94 tests), `pnpm build`가 통과했다. 최초 build와 E2E의 샌드박스 로컬 포트 실패는 제품 실패가 아니며, build는 정상 권한 재실행에서 통과했다. `pnpm test:e2e`는 사용자 소유 Next 개발 서버 PID 45777의 잠금 때문에 기준선 완료 전 서버를 새로 띄우지 못했으므로 Goal 완료 전 동일 명령을 통과해야 한다.

## 마일스톤별 검증

각 마일스톤 종료 시 가장 작은 관련 검증부터 실행한다.

```bash
pnpm test -- tests/admin-event-schedule.test.ts tests/admin-location-validation.test.ts tests/admin-datetime.test.ts tests/format.test.ts
pnpm typecheck
pnpm test -- tests/source.test.ts tests/format.test.ts
pnpm test:e2e -- --grep "행사 작성|행사 상세 링크|운영일정"
```

구현 중 새 테스트 파일을 만들면 위 targeted 명령에 포함하고 `pnpm test` 전체 검증도 유지한다.

## 수동 확인 절차

1. 인증된 운영자로 `/admin/events/new`를 열어 slug, 위도, 경도, 위치 근거 URL, 위치 확인일, 마지막 확인일, 공식 안내 URL 입력이 보이지 않는지 확인한다.
2. 필수 안내와 행사명·카테고리·참여 대상·출처 기관·행사 안내 URL의 `*` 및 접근성 이름을 확인한다.
3. 필수값을 비운 제출, 참여 대상 미선택, 잘못된 행사 안내 URL을 각각 시도해 이해 가능한 오류가 노출되는지 확인한다.
4. 운영일정에 두 줄 이상을 입력하고 작성 완료한 뒤 `/admin` 이동과 신규 성공 메시지를 확인한다.
5. 생성한 행사의 상세 화면에서 운영일정 줄바꿈, `행사 안내`, 조건부 `신청·예매`, 자동 `공유하기`, `관련 링크` 행 부재를 확인한다.
6. 좌표·위치 근거·`official_url`이 있는 기존 행사를 수정하고 `/admin` 이동과 수정 성공 메시지를 확인한 뒤 저장 전후 해당 DB 값과 slug가 동일한지 확인한다.
7. 신청 URL이 없는 행사와 있는 행사를 각각 열어 CTA가 정확히 한 번씩만 생성되는지 확인한다.

## 시각 검증

- [x] 데스크톱 1440×900에서 신규·수정 폼과 공개 행사 상세 확인
- [x] 모바일 412×915에서 신규·수정 폼과 공개 행사 상세 확인
- [x] section 제목, 필수 표시, label, 도움말, CTA 우선순위가 한눈에 구분됨
- [x] 텍스트 겹침·잘림·가로 넘침 없음
- [x] 키보드 탭 순서, focus 표시, checkbox fieldset/legend, 오류·성공 상태 확인
- [x] 기존 design token과 반응형 입력 패턴 유지
- [x] Playwright test output에 신규·수정 폼과 공개 상세의 desktop/mobile 스크린샷 저장 후 `view_image`로 직접 검사

별도 `references/`와 `sources.json` 디자인 레퍼런스는 없으므로 외부 스타일 수집이나 이미지 승계는 하지 않는다.

## 완료 기준 매핑

| PRD 완료 기준 | 검증 방식 | 상태 |
| --- | --- | --- |
| AC-1 | slug 생성 helper 단위 테스트, 신규 폼 E2E, 수정 폼 hidden slug 유지 검사 | 통과 |
| AC-2 | 폼 필드 부재 E2E, update payload 기술 필드 부재 단위 테스트, 좌표 없는 신규 payload | 통과 |
| AC-3 | 폼 필드 부재 E2E, 동일 시각의 event/source payload 단위 테스트와 action 연결 확인 | 통과 |
| AC-4 | 접근성 이름·required·참여 대상 조건부 required desktop/mobile E2E | 통과 |
| AC-5 | 관리자 폼 문구·필드·CTA 설명 desktop/mobile E2E와 시각 검사 | 통과 |
| AC-6 | 공개 상세 desktop/mobile E2E, CTA 개수와 `관련 링크` 부재 및 시각 검사 | 통과 |
| AC-7 | 포맷터 단위 테스트, textarea 재수정 E2E, 공개 `whitespace-pre-line`과 시각 확인 | 통과 |
| AC-8 | 신규·수정 action redirect helper, 대시보드 메시지 helper와 desktop/mobile E2E | 통과 |
| AC-9 | desktop/mobile 가로 넘침 E2E·직접 시각 검사·lint/typecheck/build/full E2E | 통과 |

## 완료로 보지 않는 조건

- 필수 검증 중 하나라도 실패
- PRD.md 또는 PLAN.md 밖 scope로 변경됨
- 명시적 승인 없이 public API 또는 DB schema가 변경됨
- 수동 재현 또는 데스크톱·모바일 시각 확인이 끝나지 않음
- 기능 검증만 통과하고 UI 겹침·잘림·접근성 검토가 끝나지 않음
- slug·좌표·위치 근거·`official_url` 등 기존 레거시 값이 수정 저장으로 손실됨
- 링크 label만 바꾸고 포스터 CTA와 `관련 링크` 중복을 그대로 둠
- textarea로 바꿨지만 공개 화면에서 줄바꿈을 다시 한 줄로 합침
- 검증을 통과시키기 위해 테스트·검증이 삭제 또는 skip됨
- 진단 없이 오류가 침묵 처리됨
- 사용자 변경이 명시적 지시 없이 되돌려짐
