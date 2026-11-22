-- 운영 안내(status_note)에 끝나는 날(status_note_until)을 둔다(2026-11-22 사용자 결정).
-- "12월 10일까지만 운영"처럼 날짜가 든 안내는 그날이 지나면 틀린 정보가 되는데, 사람이 지우지 않으면 화면에 그대로 남았다.
-- 끝나는 날이 지나면 화면이 안내를 숨긴다(features/places/model/place-status.ts). 비워 두면 늘 보인다.
-- 운영 상태(operation_status) 자체는 자동으로 바꾸지 않는다: 휴장 시작·재개는 관리자가 확인한 뒤 바꾼다.
alter table public.places
  add column status_note_until date;

-- 지금 날짜가 든 안내 3곳. 안내 문구가 이 migration을 만들 때 그대로일 때만 날짜를 넣는다(관리자가 그사이 고쳤으면 건드리지 않는다).
-- 척산족욕공원은 겨울 휴장 동안에도 "3월에 다시 열어요"가 맞는 안내라 휴장이 끝나는 2월 말까지 보인다.
update public.places set status_note_until = '2027-02-28'
where slug = 'cheoksan-foot-spa-park'
  and status_note = '11월 30일까지 운영하고, 12월 1일부터 2월 말까지 겨울 휴장해요. 3월에 다시 열어요.';
update public.places set status_note_until = '2026-12-10'
where slug = 'sokcho-yacht-boat-club'
  and status_note = '제트보트는 12월 10일까지만 운영합니다.';
update public.places set status_note_until = '2026-12-15'
where slug = 'lotte-resort-sokcho-waterpark'
  and status_note = '실외 워터파크는 2026년 12월 15일까지 공사로 쉽니다. 실내 워터파크는 운영합니다.';
