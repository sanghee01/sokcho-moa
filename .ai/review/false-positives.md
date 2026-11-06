# False Positives

AI 리뷰가 잘못 지적했고, 사용자가 반박해 확정한 케이스입니다. 다음 리뷰부터 이 조건에 해당하는
지적은 하지 않거나 심각도를 낮춥니다.

- 사용자가 근거와 함께 반박한 지적만 등록합니다. 답하지 않았다는 이유만으로 등록하지 않습니다.
- 한 번만 맞지 않았던 지적이 아니라, **같은 조건에서 다시 나올 수 있는 지적**만 등록합니다.
- "기존 구현이 원래 그렇다"는 반박 근거가 아닙니다. 사용자가 그 동작을 의도로 확인한 경우에만 근거가 됩니다.
- 반박이 "앞으로 이렇게 짜야 한다"는 규칙이 되면 여기 대신 해당 폴더의 `AGENTS.md`에 씁니다.

## 형식

```markdown
### [영역] 잘못된 지적 제목

- **날짜**: YYYY-MM-DD
- **원래 심각도**: critical | major | minor
- **조정**: ignore | lower_severity | context_dependent
- **근거**: 반박한 PR·리뷰 링크, 또는 관련 결정 문서

왜 오탐인지, 어떤 조건에서는 여전히 지적해야 하는지.
```

---

### [보안] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 브라우저에 노출된다는 지적

- **날짜**: 2026-11-05
- **원래 심각도**: critical
- **조정**: ignore
- **근거**: 예방 등록(AI 작성, 사용자 확인 필요). Supabase publishable key는 브라우저에 공개하도록
  만든 키이며, 접근 제어는 RLS가 담당합니다.

publishable key의 노출 자체는 지적하지 않습니다. 대신 이 키로 접근할 수 있는 table의 RLS가 비어
있거나 너무 넓으면 [REVIEW.md의 데이터·권한](REVIEW.md#데이터권한)에 따라 지적합니다.
`SUPABASE_SERVICE_ROLE_KEY`, `SUBMISSION_RATE_LIMIT_HMAC_SECRET`, `REVALIDATE_SECRET`에는 이 예외를
적용하지 않습니다.
