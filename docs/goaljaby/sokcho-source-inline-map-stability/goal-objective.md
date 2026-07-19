먼저 다음 문서를 읽고 source of truth로 따른다.
- docs/goaljaby/sokcho-source-inline-map-stability/PRD.md
- docs/goaljaby/sokcho-source-inline-map-stability/VALIDATION.md
- docs/goaljaby/sokcho-source-inline-map-stability/RECOVERY.md
- docs/goaljaby/sokcho-source-inline-map-stability/PLAN.md
- docs/goaljaby/sokcho-source-inline-map-stability/PROGRESS.md

목표: 모든 운영 행사의 공식 원문과 위치를 실제 콘텐츠까지 검증하고, 상세 화면에 정확한 네이버 인라인 지도를 표시하며, 무문구 이미지 fallback과 레이아웃 이동 없는 관리자 상태 변경 UI를 완성한다. 지도 공급자는 사용자 승인으로 카카오에서 네이버 Maps JavaScript API v3로 변경됐으며 유료 API를 활성화하지 않는다.

모든 PRD acceptance criterion을 만족하고 VALIDATION.md의 자동·운영·시각 검증이 통과할 때까지 PLAN.md의 마일스톤 순서로 계속한다. PRD.md와 PLAN.md 밖으로 scope 확장 금지이며 비범위 기능, 승인되지 않은 public API·DB schema 변경, 테스트 삭제·skip을 추가하지 않는다. 각 마일스톤과 실패한 검증 뒤 PROGRESS.md를 업데이트한다. 같은 blocking condition 또는 validation failure가 3회 반복되면 요구사항을 약화하지 말고 사용자·제품 결정을 요청한다. 필수 검증과 production 원문 N/N·지도 M/M·관리자 상태 복구 증거가 없으면 Goal을 완료로 표시하지 않는다.

편집 전에 원래 결함을 재현하고 영향 모듈과 관련 테스트만 변경하며, 수정 후 같은 재현과 회귀 검증으로 결함이 사라졌음을 증명한다. 운영 변경 전 events와 event_sources를 백업하고 기존 행사·출처·검수 상태와 사용자 작업트리 변경을 보존한다.
