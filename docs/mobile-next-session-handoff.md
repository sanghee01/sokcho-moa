# 모바일 출시 후속 작업 인수인계

최종 갱신: 2026-07-27

## 다음 Codex에게 먼저 보낼 문장

아래 문장을 새 작업의 첫 메시지로 그대로 사용하면 된다.

> 이 저장소의 `docs/mobile-next-session-handoff.md`를 가장 먼저 읽고 지침을 따라줘.
> 기존 모바일 기반을 재구현하지 말고 `git status --short`로 사용자 변경을 보존해.
> `docs/mobile-release-checklist.md`의 미완료 항목 중 현재 예산과 자격증명으로 가능한
> 다음 수직 슬라이스 하나만 정해서 구현·검증해줘. 실제 가격과 스토어 정책은 공식
> 자료로 다시 확인하고, LIVE 안전 게이트 전에는 절대 `DRY_RUN=false`로 바꾸지 마.
> 시니어 프론트엔드·Toss Fundamentals·Clean Code 관점으로 과설계 없이 진행해줘.

## 30초 현재 상태

- 비용 없이 만들 수 있는 Expo iOS·Android 기반은 완성되고 검증됐다.
- 스토어 계정 결제, 서명 빌드, APNs·FCM 자격증명, 실제 푸시 전송은 하지 않았다.
- 앱은 로그인 없이 AsyncStorage를 원본으로 사용하고 Supabase 익명 동기화는 선택 사항이다.
- 기존 Next.js는 WebView로 재사용하고 관심 설정·저장 행사는 네이티브 UI다.
- 알림 서버는 신규 행사·저장 행사 마감을 계산하지만 기본값은 `DRY_RUN`이다.
- GoalBuddy 보드는 `done`이며, 후속 출시 작업은 완료 Goal을 재개하지 말고 새 Goal로 만든다.
- 현재 모바일 변경은 커밋되지 않았을 수 있다. 반드시 `git status --short`를 먼저 보고
  `reset`, `checkout`, `clean`으로 지우지 않는다.

## 다음 세션의 읽기 순서

토큰을 아끼기 위해 처음에는 다음만 읽는다.

1. 이 문서
2. [모바일 출시 체크리스트](./mobile-release-checklist.md)의 다음 미완료 구역
3. 선택한 작업과 직접 관련된 파일

[운영 가이드](./mobile-app-runbook.md), [검증 기록](./mobile-validation.md), GoalBuddy
receipt 전체는 불확실한 계약이나 증거가 필요할 때만 추가로 읽는다. 저장소 전체를 먼저
요약하거나 이미 통과한 구현을 다시 만들지 않는다.

## 유지해야 할 제품 결정

- PWA 설치 안내보다 40대 사용자가 쉽게 실행할 수 있는 앱 배포를 선택했다.
- React Native를 새로 모두 그리지 않고 Expo + 기존 Next.js WebView를 사용한다.
- 로그인 화면은 도입하지 않는다.
- 앱의 핵심 네이티브 가치는 관심사, 알림 설정, 저장 행사다.
- WebView 저장은 실제 기기 User-Agent에 `SokchoMoaApp/1.0`만 덧붙이고,
  trusted-origin `/__mobile/save` URL 하나만 가로챈다. `postMessage` 저장 입구는 없다.
- `/events/[slug]`는 앱 버튼을 서버에서 확실히 분기하기 위해 현재 동적 렌더링한다.
  예상 규모에서는 수용하며, 비용·지연이 커질 때 앱 전용 상세 경로를 분리한다.
- Expo SDK 55와 React Native 0.83.6은 당시 Xcode 26.3 호환 때문에 고정했다.
  미래 세션에서 이유 없이 최신 SDK로 올리지 말고 현재 Xcode·Expo 호환표부터 확인한다.

## 현재 자동·수동 기준선

- root: 29개 파일, 164개 unit test 통과
- mobile: 4개 파일, 33개 test 통과
- Playwright: 46개 통과, 캘린더 관련 14개 의도적 skip
- iOS·Android Hermes bundle export 및 Next.js production build 통과
- iOS Simulator: 관심사·두 알림 설정 reload 복원
- Android Emulator: 설정 복원, WebView 행사 저장, 네이티브 목록, 강제 종료 후 복원
- 로컬 Supabase: 익명 사용자 2명 RLS 격리, 알림 2종, 외부 provider 요청 0건

## 비용 여유가 생겼을 때의 작업 순서

한 번에 전부 하지 말고 아래 순서에서 한 단계씩 완료한다.

1. 현재 Apple·Google·Expo 정책과 원화 비용을 공식 자료로 다시 확인한다.
2. 사용자와 Android 먼저 출시할지, iOS·Android 동시 출시할지 결정한다.
3. 현재 dirty 변경을 검토하고 사용자가 원하면 별도 브랜치와 기준 commit으로 보존한다.
4. bundle ID `com.sokchomoa.app`, Android package, 법적 판매자 이름의 사용 가능성을 확인한다.
5. 개인정보 처리방침·지원 URL·문의 주소·아이콘·splash·스토어 설명과 스크린샷을 준비한다.
6. 아래 LIVE 안전 게이트를 코드와 테스트로 먼저 닫는다.
7. `expo-notifications`, OS 권한 요청, 서버 경유 token 등록을 구현한다.
8. EAS preview 빌드를 실기기에 설치해 수신·탭 이동·종료 상태·토큰 만료를 검증한다.
9. 소량 canary가 통과한 뒤에만 `DRY_RUN=false` 전환을 별도 승인한다.
10. Google closed test 또는 TestFlight를 거쳐 단계적으로 스토어에 제출한다.

비용이 여전히 부담되면 등록비가 상대적으로 작은 플랫폼부터 시작할 수 있지만, 결제
직전 가격과 개인 계정 테스트 요건은 반드시 다시 조회한다.

## `DRY_RUN=false` 전 필수 안전 게이트

다음 항목이 하나라도 빠지면 실제 푸시를 켜지 않는다.

- stale claim 완료 시 `lock_id`를 비교하는 fencing
- Expo ticket의 receipt 조회, 실패 retry·backoff, 부분 실패 상태
- push token을 직접 CRUD하지 않는 서버 등록 endpoint
- Expo token 형식 검증, 사용자·기기별 quota와 rate limit
- 1,000행 초과 preferences·saved events·devices pagination과 batch 처리
- 실제 provider egress를 감시하는 테스트와 실기기 canary
- `SERVICE_ROLE_KEY`, dispatch secret, APNs·FCM 자격증명의 secret-manager 보관

앱 공개 설정은 HTTPS Supabase URL과 `sb_publishable_` 키만 허용한다.

## 빠른 재검증 명령

작은 변경에는 관련 테스트만 먼저 실행하고, preview 제출 직전에 전체 검사를 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @sokcho-moa/mobile test
pnpm test:notifications
pnpm notifications:dry-run
```

로컬 RLS·Edge 통합이 관련된 변경에서만 Docker를 사용한다.

```bash
pnpm dlx supabase@latest start
pnpm verify:local-mobile-backend
pnpm dlx supabase@latest stop
```

출시 후보에서는 `expo export`, `pnpm test:e2e`, `pnpm build`까지 다시 실행한다.

## 핵심 파일 지도

- Expo 앱: `apps/mobile/`
- WebView 저장 계약: `lib/mobile/event-bridge.ts`
- 앱 전용 저장 버튼: `components/save-event-button.tsx`
- 행사 상세 분기: `app/events/[slug]/page.tsx`
- 익명 데이터 RLS: `supabase/migrations/202607260001_mobile_preferences.sql`
- outbox·device·delivery: `supabase/migrations/202607260002_notification_outbox.sql`
- 알림 함수: `supabase/functions/dispatch-notifications/`
- 로컬 통합 검증: `scripts/verify-local-mobile-backend.mjs`
- EAS 프로필: `apps/mobile/eas.json`
- 남은 출시 항목: `docs/mobile-release-checklist.md`

## 후속 세션의 완료 기준

“계정 결제”나 “빌드 성공” 하나만으로 출시 완료라 하지 않는다. 선택한 플랫폼의 실기기
preview, 알림 안전 게이트, 스토어 요구 자료, 테스트 트랙, 제출 후 모니터링·롤백 계획까지
증거가 있어야 해당 출시 단계를 완료로 판정한다.
