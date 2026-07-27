# 속초모아 모바일 앱 운영 가이드

## 지금 완성된 범위

`apps/mobile`은 Expo SDK 55 기반 iOS·Android 앱입니다. 기존 Next.js 사이트를
신뢰된 origin의 WebView로 재사용하면서 다음 기능은 네이티브 UI로 제공합니다.

- 관심 카테고리·대상 선택
- 신규 행사·저장 행사 마감 알림 선택
- 행사 저장, 다시 열기, 해제
- 기기 저장을 우선하는 로그인 없는 사용 흐름
- Supabase Anonymous Auth를 이용한 선택적 백업
- 신규 행사·마감 임박 후보 계산과 서버 전용 outbox `DRY_RUN`

앱은 Supabase 설정이 없거나 동기화가 실패해도 로컬 기능을 계속 사용할 수 있습니다.
운영 푸시, 앱 서명, 스토어 제출은 외부 계정과 자격증명이 필요한 별도 출시 게이트입니다.

## 구조와 책임

| 경계 | 책임 | 보안 원칙 |
| --- | --- | --- |
| Next.js | 행사 탐색·상세·공식 링크 | 앱 WebView에서만 저장 bridge를 노출 |
| Expo 앱 | 관심사·저장 목록·WebView 탐색 | 구성된 origin의 저장 URL만 네이티브 동작으로 신뢰 |
| AsyncStorage | 즉시 반응하는 로컬 원본 | 손상된 값은 안전한 기본값으로 복구 |
| Supabase Auth/RLS | 사용자 입력 없는 익명 세션과 선택적 백업 | `auth.uid() = user_id`, 사용자끼리 행 격리 |
| Edge Function | 관심사·저장 행사 매칭, outbox claim | service role은 서버에만 두고 `DRY_RUN`을 기본값으로 사용 |

로그인 UI가 없으므로 이것은 계정 기반 다중 기기 동기화가 아닙니다. 앱 데이터나
Anonymous Auth 세션을 삭제하면 새 익명 사용자로 시작합니다.

## 필수 도구

- Node.js 22
- pnpm 9
- iOS: Xcode 26.2 이상과 Simulator
- Android: Android Studio 또는 SDK, API 35 이상 Emulator
- 통합 백엔드 검증: Docker Desktop

## 웹과 앱 실행

루트에서 의존성을 설치하고 웹을 실행합니다.

```bash
pnpm install --frozen-lockfile
pnpm dev --port 3100
```

`apps/mobile/.env`를 만들 때 iOS Simulator는 호스트의 loopback을 사용합니다.

```dotenv
EXPO_PUBLIC_WEB_URL=http://127.0.0.1:3100
```

Android Emulator에서는 호스트를 `10.0.2.2`로 가리킵니다.

```dotenv
EXPO_PUBLIC_WEB_URL=http://10.0.2.2:3100
```

그다음 별도 터미널에서 플랫폼을 실행합니다.

```bash
pnpm mobile:ios
# 또는
pnpm mobile:android
```

환경 변수가 없으면 앱은 `https://sokcho-moa.vercel.app`을 사용합니다. 외부 origin의
신청·출처 링크는 WebView가 아니라 시스템 브라우저로 열립니다.

## WebView 행사 저장 브리지

앱 WebView는 User-Agent에 `SokchoMoaApp/1.0`을 덧붙입니다. Next.js 행사 상세는 이
토큰을 서버에서 확인해 앱 요청에만 `관심 행사 저장` 링크를 렌더링합니다. 링크는
신뢰된 웹 origin의 `/__mobile/save` 경로를 사용하고, 네이티브 WebView가 페이지
이동 전에 origin·경로·payload를 검증해 로컬 저장으로 넘깁니다. 일반 브라우저에는
저장 링크가 보이지 않으며, 외부 origin의 같은 경로도 저장 요청으로 처리하지 않습니다.
User-Agent는 표시 분기일 뿐 인증 수단이 아니며, 데이터 권한은 이 값에 의존하지
않습니다.

이 계약을 변경할 때는 웹의 User-Agent 판별, 저장 URL 생성, 앱의 URL interception을
한 묶음으로 배포해야 합니다. 행사 상세는 요청 헤더에 따라 응답이 달라지므로 중간
프록시나 CDN에서 User-Agent를 무시한 단일 HTML 캐시를 추가하지 않습니다.
`/__mobile/save`는 웹 페이지나 공개 API가 아니라 네이티브가 가로채는 내부 경로입니다.

User-Agent별 버튼을 서버에서 확실하게 구분하기 위해 현재 `/events/[slug]`는 요청 시
렌더링됩니다. 행사 데이터 조회 자체는 캐시되지만 상세 HTML의 정적 생성 이점은
포기한 선택입니다. 현재 예상 규모에서는 저장 흐름의 신뢰성을 우선하며, 응답 시간이나
서버 비용이 커지면 앱 전용 상세 경로를 분리해 공개 상세의 정적 렌더링을 되살립니다.

## 로컬 Supabase와 RLS 검증

최초 실행은 Docker 이미지를 내려받기 때문에 시간이 걸릴 수 있습니다.

```bash
pnpm dlx supabase@latest start
pnpm verify:local-mobile-backend
```

검증 스크립트는 다음을 실제 로컬 스택에서 확인하고 테스트 사용자를 정리합니다.

1. Anonymous Sign-In 사용자 두 명 생성
2. 사용자 A의 관심사·저장 행사·기기 토큰 쓰기
3. 사용자 B의 교차 읽기와 위조 쓰기 차단
4. 익명 사용자의 관리자 행사 수정과 outbox 읽기 차단
5. 신규 행사와 저장 행사 마감 후보 각각 한 건 생성
6. `DRY_RUN`, 외부 네트워크 요청 0건, delivery 기록 확인
7. 두 번째 실행에서 outbox 중복 생성과 재전송 차단

작업이 끝나면 로컬 스택만 중지합니다.

```bash
pnpm dlx supabase@latest stop
```

`supabase/config.toml`은 로컬 Anonymous Sign-In을 활성화합니다. 운영 프로젝트에서도
Supabase Dashboard의 Anonymous Sign-Ins를 별도로 켜야 합니다.

앱에 선택적 동기화를 연결할 때는 로컬 `status -o json`의 API URL과 공개 키를
`apps/mobile/.env`에 옮깁니다. `SERVICE_ROLE_KEY`와 `SECRET_KEY`는 절대 앱에 넣지
않습니다. 앱은 `sb_publishable_` 키만 수락하며, 평문 HTTP는 iOS loopback과 Android
Emulator의 `10.0.2.2` 같은 로컬 개발 주소에서만 허용합니다.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=로컬_publishable_key
```

Android Emulator에서는 Supabase URL도 `http://10.0.2.2:54321`로 바꿉니다.

## 알림 개발 경계

빠른 순수 정책 검증:

```bash
pnpm test:notifications
pnpm notifications:dry-run
```

실제 DB·RLS·Edge Function 통합 검증:

```bash
pnpm dlx supabase@latest start
pnpm verify:local-mobile-backend
```

`dispatch-notifications`는 `DRY_RUN` 값이 명시적으로 `false`일 때만 Expo Push
endpoint를 호출합니다. 출시 전에는 이 값을 바꾸지 않습니다. 실제 푸시를 켜려면
다음 후속 작업이 모두 필요합니다.

1. `expo-notifications`를 앱에 추가하고 알림 동의를 받은 뒤 토큰 등록
2. Apple APNs와 Google FCM 자격증명 구성
3. iOS·Android 실기기에서 수신, 탭 이동, 토큰 폐기 검증
4. 운영 스케줄러의 `x-dispatch-secret`을 secret manager에 저장
5. claim `lock_id` fencing과 중복 전송 허용 범위 확정
6. Expo receipt 조회, 실패 재시도·backoff, 부분 실패 상태 구현
7. push token 등록을 서버 함수로 옮기고 형식·사용자별 quota·rate limit 적용
8. 1,000행을 넘는 preferences·saved events·devices를 pagination/batch 처리
9. 실제 provider egress를 감시하는 테스트와 소량 canary
10. 위 항목과 실기기 receipt 감시를 통과한 뒤에만 `DRY_RUN=false`

푸시 권한은 앱 첫 실행에 묻지 않고, 사용자가 알림 토글을 켜며 효용을 이해한 뒤
요청하는 것이 원칙입니다.

## 품질 검사

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:notifications
pnpm notifications:dry-run
pnpm --filter @sokcho-moa/mobile lint
pnpm --filter @sokcho-moa/mobile typecheck
pnpm --filter @sokcho-moa/mobile test
pnpm --filter @sokcho-moa/mobile exec expo export --platform ios --output-dir /tmp/sokcho-moa-mobile-ios
pnpm --filter @sokcho-moa/mobile exec expo export --platform android --output-dir /tmp/sokcho-moa-mobile-android
pnpm test:e2e
pnpm build
```

`expo export`는 JavaScript 번들 가능성을 검증할 뿐 스토어 제출용 서명 바이너리는
아닙니다.

수동 검증 환경, 실제 확인한 흐름과 증빙 이미지는
[모바일 검증 기록](./mobile-validation.md)에 보관합니다. 현재 기준선은 iOS Simulator의
관심사·알림 설정 복원, Android Emulator의 설정·WebView 저장·강제 종료 후 복원,
그리고 로컬 Supabase RLS·알림 `DRY_RUN`입니다. 실제 푸시와 서명 바이너리는 포함하지
않습니다.

## 비용 없는 보관 전략

지금은 소스, migration, 자동 검증, EAS 프로필만 보관하고 스토어 계정은 결제하지
않아도 됩니다. 로컬 개발 빌드는 Expo CLI와 Xcode·Android SDK로 만들 수 있고,
Expo의 Free 플랜도 제한된 cloud build를 제공합니다.

2026-07-26 공식 가격 기준:

- Apple Developer Program: 연 US$99, 지역별 현지 통화 가격 가능
- Google Play Console: 최초 1회 US$25
- Expo Push Service: 발송 요금 없음, 프로젝트당 초당 600건 제한
- Supabase Free: 월 활성 사용자 50,000명, Edge Function 월 500,000회 포함
- Expo Free: 월 iOS 15회·Android 15회 cloud build 포함

따라서 다운로드가 100명, 200명, 500명, 1,000명인 구간에서는 단순 푸시 건수 때문에
곧바로 비용이 생기는 구조가 아닙니다. 무료 한도와 이용 패턴을 넘는지 월별로 확인하면
됩니다. 가격과 한도는 결제 직전에 반드시 공식 페이지에서 다시 확인하세요.

- [Apple Developer Program 등록](https://developer.apple.com/programs/enroll/)
- [Google Play Console 등록](https://support.google.com/googleplay/android-developer/answer/6112435)
- [Expo Push FAQ](https://docs.expo.dev/push-notifications/faq/)
- [Expo 가격](https://expo.dev/pricing)
- [Supabase 가격](https://supabase.com/pricing)
