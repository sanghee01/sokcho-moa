-- 되돌리기: supabase/migrations/20261121050439_expand_places_and_add_notices.sql
-- 되돌리면 정보가 사라진다: notices의 모든 글, places에 채운 즐길거리 값(분류·태그·운영시간·요금·유의사항·확인일 등).
-- 되돌리기 전에 아래 두 조회 결과를 CSV로 내려받아 둔다.
--   select * from public.notices;
--   select id, slug, activity_category, tags, description, hours_summary, closed_summary, price_summary, phone,
--          parking_summary, cautions, booking_url, operation_status, status_note, verified_on
--   from public.places where activity_category is not null or verified_on is not null;

drop table public.notices;

alter table public.places
  drop column activity_category,
  drop column tags,
  drop column description,
  drop column hours_summary,
  drop column closed_summary,
  drop column price_summary,
  drop column phone,
  drop column parking_summary,
  drop column cautions,
  drop column booking_url,
  drop column operation_status,
  drop column status_note,
  drop column verified_on;
