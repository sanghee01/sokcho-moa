-- 되돌리기: supabase/migrations/20261121064211_add_place_image_credit.sql
-- 되돌리면 장소 사진의 출처 문구·원본 주소·대체 텍스트가 사라진다. 사진 주소(image_url)는 남으므로,
-- 되돌린 뒤에는 출처 없이 사진이 보이지 않게 코드도 함께 되돌린다.
-- 되돌리기 전에 아래 조회 결과를 CSV로 내려받아 둔다.
--   select id, slug, image_url, image_credit, image_source_url, image_alt from public.places where image_url is not null;

alter table public.places
  drop constraint places_image_credit_required,
  drop column image_credit,
  drop column image_source_url,
  drop column image_alt;
