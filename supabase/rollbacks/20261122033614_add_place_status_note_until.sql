-- 되돌리기: supabase/migrations/20261122033614_add_place_status_note_until.sql
-- 칸을 지우면 관리자가 넣은 끝나는 날도 함께 사라진다. 되돌리기 전에 값을 남겨 두려면 먼저 아래를 실행해 결과를 보관한다.
--   select slug, status_note_until from public.places where status_note_until is not null;
-- 코드가 이 칸을 읽으므로, 되돌릴 때는 이 칸을 쓰지 않는 코드를 먼저 배포한다.
alter table public.places drop column status_note_until;
