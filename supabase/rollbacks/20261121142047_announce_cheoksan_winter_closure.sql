-- 되돌리기: supabase/migrations/20261121142047_announce_cheoksan_winter_closure.sql
-- 이 migration이 넣은 문장 그대로일 때만 예전 안내로 돌린다.
update public.places
set status_note = '12월부터 2월까지는 겨울 휴장입니다.'
where slug = 'cheoksan-foot-spa-park' and status_note = '11월 30일까지 운영하고, 12월 1일부터 2월 말까지 겨울 휴장해요. 3월에 다시 열어요.';
