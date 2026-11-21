-- 장소 사진의 출처 표기와 대체 텍스트(2026-11-21 사용자 요청: 장소마다 실제 사진을 싣는다).
-- 사진은 재게시가 허용된 것(공공누리 제1유형, 크리에이티브 커먼스)만 쓰므로 출처 표시가 조건이다.
-- image_url은 이미 있다. 사진을 싣는 장소는 아래 세 칸을 함께 채운다.
alter table public.places
  -- 사진 아래에 그대로 보이는 출처 문구. 예: "사진: 홍길동, CC BY-SA 4.0 (위키미디어 공용)"
  add column image_credit text,
  -- 라이선스가 적힌 원본 페이지. 출처 문구가 이 주소로 가는 링크가 된다.
  add column image_source_url text,
  -- 사진에 무엇이 보이는지 적은 대체 텍스트. 이름만 되풀이하지 않는다.
  add column image_alt text,
  -- 사진이 있는데 출처가 없는 상태로는 저장하지 못하게 한다(출처 표시 누락은 라이선스 위반이다).
  -- not valid: 지금 있는 행은 검사하지 않고 앞으로 넣거나 고치는 행만 검사한다. 운영에 출처 없이 사진 주소만 넣어 둔
  -- 명소가 있어도 이 migration이 실패하지 않는다. 그런 행은 다음에 고칠 때 출처를 함께 넣어야 저장된다.
  add constraint places_image_credit_required check (image_url is null or image_credit is not null) not valid;
