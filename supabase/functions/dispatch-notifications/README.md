# 알림 Dispatch Edge Function

`dispatch-notifications`는 관심 설정과 저장 행사를 읽어 결정론적인 outbox 후보를
만들고, DB 함수로 작업을 원자적으로 claim합니다.

- `x-dispatch-secret` 헤더가 `NOTIFICATION_DISPATCH_SECRET`과 일치해야 실행됩니다.
- `DRY_RUN`은 누락되거나 `false` 이외의 값이면 항상 활성화됩니다.
- DRY_RUN에서는 Expo endpoint를 호출하지 않고 outbox/delivery 증거만 기록합니다.
- 실제 전송은 `DRY_RUN=false`를 명시한 경우에만 실행됩니다.
- `SUPABASE_SERVICE_ROLE_KEY`와 dispatch secret은 Edge Function secret으로만
  보관하며 웹·모바일 환경 변수에 넣지 않습니다.

로컬 또는 배포 환경에서 호출할 때:

```bash
curl -X POST \
  -H "x-dispatch-secret: $NOTIFICATION_DISPATCH_SECRET" \
  "$FUNCTION_URL"
```

현재 저장소 작업은 함수 배포나 실제 전송을 수행하지 않습니다. 먼저 로컬 Supabase
스택과 `DRY_RUN=true`로 검증하고, 실기기 토큰·Apple/Google 자격증명이 준비된 출시
단계에서만 live gate를 검토합니다.

`DRY_RUN=false`로 바꾸기 전에는 다음 운영 안전장치를 먼저 구현해야 합니다.

- claim 완료 시 `lock_id`를 비교하는 fencing과 중복 전송 허용 범위 확정
- Expo ticket 이후 receipt 조회, 실패 재시도·backoff, 부분 실패 상태 모델
- 서버 경유 push token 등록, Expo token 형식 검증, 사용자·기기별 quota와 rate limit
- preferences·events·saved events·devices의 pagination과 후보 batch 처리
- 실제 provider egress를 감시하는 테스트와 소량 canary

현재 live helper는 향후 통합 경계를 보여주는 준비 코드이며 위 조건을 충족한 운영
발송기로 간주하지 않습니다.
