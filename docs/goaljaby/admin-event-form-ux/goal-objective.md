다음 문서를 먼저 읽고 source of truth로 따른다.
- docs/goaljaby/admin-event-form-ux/PRD.md
- docs/goaljaby/admin-event-form-ux/VALIDATION.md
- docs/goaljaby/admin-event-form-ux/RECOVERY.md
- docs/goaljaby/admin-event-form-ux/PLAN.md
- docs/goaljaby/admin-event-form-ux/PROGRESS.md

Goal: 속초모아 운영자가 기술 메타데이터를 직접 다루지 않고도 필수 정보와 공개 화면의 노출 결과를 이해하며 행사를 작성·수정하고, 완료 후 대시보드로 자연스럽게 돌아가게 한다.

PRD의 모든 완료 기준을 만족하고 VALIDATION.md의 필수 검증이 모두 통과할 때까지 PLAN.md의 마일스톤 순서로 진행한다. PRD.md와 PLAN.md 밖으로 scope 확장 금지이며 public API나 DB schema를 승인 없이 변경하지 않는다. 기존 행사 slug·위치 메타데이터·official_url과 사용자 변경을 보존하고 테스트를 삭제하거나 skip하지 않는다. 각 마일스톤과 검증 실패 후 PROGRESS.md를 업데이트한다. 같은 blocking condition 또는 validation failure가 3회 반복되면 요구사항을 약화하지 말고 멈춰 사용자·제품 결정을 요청한다. 필수 검증과 데스크톱·모바일 시각 확인 전에는 Goal을 완료 처리하지 않는다.

기존 design pattern을 유지하고 필수 표시·키보드·스크린리더 계약, 두 viewport의 잘림·겹침·가로 넘침, 작성/수정 저장과 공개 CTA의 실제 흐름을 검증해 시각 증거를 남긴다.
