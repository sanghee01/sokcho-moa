# 속초모아 모바일

Expo SDK 55 기반의 iOS·Android 앱입니다. 기존 속초모아 웹을 안전한 WebView로
탐색하고, 관심 분야·대상·알림 설정과 저장 행사는 네이티브 화면에서 관리합니다.
로그인은 없습니다. 데이터는 기기의 AsyncStorage에 먼저 저장되고, 선택적으로 Supabase
공개 환경 변수를 넣은 개발 환경에서는 사용자 입력 없는 Anonymous Auth 세션으로
동기화됩니다.

## 실행

저장소 루트에서 의존성을 설치한 뒤 실행합니다.

```bash
pnpm install
pnpm mobile:ios
# 또는
pnpm mobile:android
```

로컬 웹을 연결하려면 `apps/mobile/.env`를 만들고 다음 값을 지정합니다.

```dotenv
EXPO_PUBLIC_WEB_URL=http://127.0.0.1:3100
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

앱은 이 URL과 같은 origin만 WebView 안에서 탐색합니다. 다른 origin의 신청·출처
링크는 시스템 브라우저로 엽니다. Supabase 두 값 중 하나라도 없거나 올바르지 않으면
동기화를 시도하지 않고 로컬 전용으로 계속 동작합니다. 운영 프로젝트에서는
Anonymous Sign-Ins를 명시적으로 활성화해야 하며, service role key는 앱에 넣지 않습니다.

## 현재 알림 경계

관심 분야와 알림 종류는 기기에 저장되고 선택적으로 개인 RLS 행에 동기화되지만,
원격 푸시는 아직 전송하지 않습니다. Supabase Edge Function은 관심사와 저장 행사를
대조해 신규 행사와 마감 임박 후보를 만들 수 있지만 `DRY_RUN=true`가 기본이며, 이
상태에서는 외부 푸시 제공자 요청이 0건입니다. Apple·Google 개발자 계정이나 운영
자격증명 없이 안전하게 개발하기 위한 의도된 경계입니다.

로컬 RLS와 알림 흐름은 저장소 루트에서 다음처럼 검증합니다.

```bash
pnpm dlx supabase@latest start
pnpm verify:local-mobile-backend
pnpm dlx supabase@latest stop
```

개발·미리보기·운영 빌드 프로필은 `eas.json`에 준비되어 있습니다. 스토어 계정과
서명 자격증명을 결제하기 전에는 `expo export`와 시뮬레이터 검증만으로 충분합니다.
전체 운영 절차와 출시 게이트는 `docs/mobile-app-runbook.md`와
`docs/mobile-release-checklist.md`를 확인하세요.
