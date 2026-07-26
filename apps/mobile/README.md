# 속초모아 모바일

Expo SDK 55 기반의 iOS·Android 앱입니다. 기존 속초모아 웹을 안전한 WebView로
탐색하고, 관심 분야·대상·알림 설정과 저장 행사는 네이티브 화면에서 관리합니다.
로그인은 없으며 이 단계의 데이터는 기기의 AsyncStorage에만 저장됩니다.

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
```

앱은 이 URL과 같은 origin만 WebView 안에서 탐색합니다. 다른 origin의 신청·출처
링크는 시스템 브라우저로 엽니다.

## 현재 알림 경계

관심 분야와 알림 종류는 기기에 저장되지만 원격 푸시는 아직 전송하지 않습니다.
Apple·Google 개발자 계정이나 운영 자격증명 없이 안전하게 개발하기 위한 의도된
경계입니다. 이후 Supabase 익명 동기화와 `DRY_RUN` 발송 기반을 연결합니다.
