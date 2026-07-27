# 속초모아 모바일 출시 체크리스트

이 문서는 “코드는 미리 완성하고, 비용은 출시할 때 지불한다”는 경계를 지킵니다.
체크되지 않은 외부 게이트가 하나라도 있으면 출시 완료로 보지 않습니다.
새 Codex 세션에서 이어갈 때는 먼저
[모바일 출시 후속 작업 인수인계](./mobile-next-session-handoff.md)를 읽습니다.

## 현재 개발 검증 기준선

2026-07-27 기준으로 다음 항목은 로컬 개발 환경에서 확인했습니다. 상세 환경과 이미지는
[모바일 검증 기록](./mobile-validation.md)에 있습니다.

- [x] iOS Simulator에서 관심사·알림 선택과 Metro reload 뒤 복원
- [x] Android Emulator에서 관심사·알림 선택과 앱 강제 종료·재실행 뒤 복원
- [x] Android 앱 WebView 전용 저장 링크에서 네이티브 저장 목록으로 행사 전달
- [x] Android 앱 강제 종료·재실행 뒤 저장 행사 복원
- [x] 로컬 Supabase에서 두 익명 사용자 RLS 격리
- [x] 신규 행사·저장 행사 마감 후보의 `DRY_RUN`과 provider 요청 0건
- [ ] APNs·FCM 자격증명과 실제 provider 전송
- [ ] iOS·Android 실기기 푸시 수신
- [ ] 서명된 preview·production 바이너리와 스토어 제출

위 체크 결과는 개발 기준선이며, 아래의 계정·실기기·운영·심사 게이트를 대신하지
않습니다.

## 1. 계정과 고정 비용

- [ ] Apple Developer Program 가입: 연 US$99
- [ ] Google Play Console 가입: 최초 1회 US$25
- [ ] 결제 당일 원화 가격과 세금 확인
- [ ] 공개될 개인 또는 조직의 법적 이름·연락처 확인
- [ ] 새 Google 개인 계정이라면 실제 Android 기기 인증 완료
- [ ] 새 Google 개인 계정이라면 12명 이상이 14일 연속 참여하는 closed test 완료

가격과 계정 요구 사항은 다음 공식 문서를 기준으로 다시 확인합니다.

- [Apple 가입과 연회비](https://developer.apple.com/programs/enroll/)
- [Google Play 가입과 1회 등록비](https://support.google.com/googleplay/android-developer/answer/6112435)
- [Google 개인 계정 테스트 요건](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Google 실제 기기 인증](https://support.google.com/googleplay/android-developer/answer/14316361)

## 2. 제품 완성도

- [ ] 둘러보기, 관심 설정, 저장 행사가 앱 안에서 명확한 역할을 가짐
- [ ] 관심사와 저장 목록이 앱 재시작 뒤 복원됨
- [ ] 일반 브라우저에는 앱 전용 저장 버튼이 나타나지 않음
- [ ] `SokchoMoaApp/1.0` 요청에만 앱 전용 저장 링크를 노출함
- [ ] 신뢰된 웹 origin의 `/__mobile/save`만 네이티브 저장 요청으로 허용함
- [ ] 신뢰된 웹 origin만 내부 탐색과 bridge message를 허용함
- [ ] 외부 신청·출처 링크가 시스템 브라우저에서 열림
- [ ] 빈 목록, 오프라인, 웹 오류, 저장 오류 상태의 안내 확인
- [ ] 40대 사용자가 읽기 쉬운 글자 크기와 44pt 이상의 터치 영역 확인
- [ ] 개인정보 처리방침, 지원 URL, 문의 이메일 공개
- [ ] 앱 아이콘, splash, 스토어 스크린샷, 설명문 준비

Apple은 단순히 웹사이트를 다시 포장한 앱보다 지속적인 효용과 앱다운 기능을
요구합니다. 관심사·저장·알림 관리는 이 기준을 위한 핵심 네이티브 가치이므로 제거하지
않습니다. 제출 직전 [App Review Guidelines 4.2](https://developer.apple.com/app-store/review/guidelines/)를
다시 확인합니다.

## 3. 데이터와 보안

- [ ] 운영 Supabase Anonymous Sign-Ins 활성화
- [ ] 앱에는 HTTPS URL과 `sb_publishable_` key만 포함
- [ ] service role, dispatch secret, APNs·FCM 자격증명은 secret manager에 저장
- [ ] 운영 DB에서 사용자 A/B RLS 격리 재검증
- [ ] 익명 사용자가 관리자 행사 쓰기를 할 수 없음
- [ ] outbox와 delivery를 앱 사용자가 읽을 수 없음
- [ ] 익명 사용자 데이터 삭제·보존 정책을 개인정보 처리방침에 반영
- [ ] 앱 삭제 시 로컬 설정과 계정 없는 익명 데이터의 관계를 안내
- [ ] 재설치 뒤 복구할 수 없는 orphan 익명 사용자의 보존기간·정리 작업 운영

## 4. 알림

- [ ] 알림 토글을 켠 뒤에만 OS 권한 요청
- [ ] 거부해도 앱의 탐색·저장 기능이 계속 동작
- [ ] 실제 Expo push token 형식과 기기별 갱신 처리
- [ ] push token 등록을 서버 함수로 제한하고 사용자·기기별 quota와 rate limit 적용
- [ ] iOS APNs와 Android FCM 자격증명 등록
- [ ] 신규 행사는 선택한 관심 카테고리·대상에만 발송
- [ ] 마감 임박은 저장한 행사에만 발송
- [ ] 동일 outbox·기기 delivery 중복 방지
- [ ] stale claim 완료 시 `lock_id`를 비교하는 fencing 적용
- [ ] Expo receipt 조회와 실패 retry·backoff·부분 실패 상태 구현
- [ ] 1,000행 초과 관심사·저장 행사·기기 조회를 pagination/batch 처리
- [ ] `DeviceNotRegistered` 토큰 자동 비활성화
- [ ] 실기기 canary 전까지 `DRY_RUN=true`
- [ ] 실제 provider egress를 감시하는 테스트 통과
- [ ] iOS·Android에서 수신, 탭 이동, 앱 종료 상태를 각각 검증

Expo Push Service 자체에는 발송 요금이 없고 프로젝트당 초당 600건 제한이 있습니다.
100~1,000명 규모에서는 비용보다 권한 동의율, 잘못된 발송 방지, 만료 토큰 정리가 먼저
운영 리스크입니다. [Expo Push FAQ](https://docs.expo.dev/push-notifications/faq/)를
출시 시점에 다시 확인합니다.

## 5. 자동 검증

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm dlx supabase@latest start`
- [ ] `pnpm verify:local-mobile-backend`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm test:notifications`
- [ ] `pnpm notifications:dry-run`
- [ ] `pnpm --filter @sokcho-moa/mobile lint`
- [ ] `pnpm --filter @sokcho-moa/mobile typecheck`
- [ ] `pnpm --filter @sokcho-moa/mobile test`
- [ ] iOS와 Android `expo export`
- [ ] `pnpm test:e2e`
- [ ] `pnpm build`
- [ ] iOS Simulator 핵심 흐름 확인
- [ ] Android Emulator 핵심 흐름 확인
- [ ] iOS·Android 실기기 접근성·네트워크·푸시 확인

## 6. 빌드와 제출

`apps/mobile/eas.json`에는 `development`, `preview`, `production` 프로필이 있습니다.
계정과 서명 자격증명이 준비된 뒤에만 다음을 실행합니다.

```bash
cd apps/mobile
pnpm dlx eas-cli@latest build --platform android --profile preview
pnpm dlx eas-cli@latest build --platform ios --profile preview
pnpm dlx eas-cli@latest build --platform all --profile production
```

- [ ] bundle identifier와 Android package 소유권 확인
- [ ] `version`, `buildNumber`, `versionCode` 증가
- [ ] preview 바이너리로 내부 검수
- [ ] 개인정보 설문과 데이터 안전 양식 실제 동작대로 작성
- [ ] 연령 등급, 카테고리, 저작권 확인
- [ ] 심사 메모에 WebView와 네이티브 관심사·저장·알림 흐름 설명
- [ ] 단계적 출시와 롤백 기준 준비

스토어 결제 전에도 로컬 빌드와 Simulator·Emulator 개발은 계속할 수 있습니다.
Expo Free 플랜의 현재 cloud build 한도는 iOS 15회와 Android 15회/월이며, 제한과
가격은 [Expo 가격](https://expo.dev/pricing)에서 다시 확인합니다.
