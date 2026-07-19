먼저 다음 문서를 읽고 source of truth로 따른다.
- docs/goaljaby/sokcho-source-inline-map-stability/PRD.md
- docs/goaljaby/sokcho-source-inline-map-stability/VALIDATION.md
- docs/goaljaby/sokcho-source-inline-map-stability/RECOVERY.md
- docs/goaljaby/sokcho-source-inline-map-stability/PLAN.md
- docs/goaljaby/sokcho-source-inline-map-stability/PROGRESS.md

목표: 모든 운영 행사의 공식 원문과 위치를 실제 콘텐츠까지 검증하고, 상세 화면에서 과금 가능한 지도 미리보기·SDK·빈 fallback 영역을 제거한 채 장소·주소와 정확한 단일 장소 또는 공식 주소가 확인된 영역 장소의 일반 외부 지도 링크를 제공하며, 서로 다른 주소의 다중 장소에는 원문 주소 확인을 안내한다. 무문구 이미지 fallback과 레이아웃 이동 없는 관리자 상태 변경 UI를 완성하고, 검증 좌표와 위치 근거는 보존하되 인라인 지도 재도입은 미래의 별도 결정으로 연기한다.

모든 PRD acceptance criterion을 만족하고 VALIDATION.md의 자동·운영·시각 검증이 통과할 때까지 PLAN.md의 마일스톤 순서로 계속한다. PRD.md와 PLAN.md 밖으로 scope 확장 금지이며 비범위 기능, 승인되지 않은 public API·DB schema 변경, 활성 기능 테스트 삭제·skip을 추가하지 않는다. 제거되는 SDK 전용 테스트는 지도 미리보기·SDK 요청 0건과 장소·주소·외부 링크 회귀로 일대일 대체한다. 각 마일스톤과 실패한 검증 뒤 PROGRESS.md를 업데이트한다. 같은 blocking condition 또는 validation failure가 3회 반복되면 요구사항을 약화하지 말고 사용자·제품 결정을 요청한다. 필수 검증과 production 원문 N/N·지도 미리보기 및 SDK 요청 0건·관리자 상태 복구 증거가 없으면 Goal을 완료로 표시하지 않는다.

편집 전에 원래 결함을 재현하고 영향 모듈과 관련 테스트만 변경하며, 수정 후 같은 재현과 회귀 검증으로 결함이 사라졌음을 증명한다. 운영 변경 전 events와 event_sources를 백업하고 기존 행사·출처·검수 상태와 사용자 작업트리 변경을 보존한다.
