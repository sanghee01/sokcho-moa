-- 조회수 RPC: 방문자(anon)는 공개 행사의 조회수만 1씩 올릴 수 있다.
-- API route는 RPC가 null을 돌려주면 "공개 행사 없음"(404)으로 응답하므로, 그 계약을 DB에서 확인한다.
begin;
select plan(5);

insert into public.events (id, slug, title, category, source_name, source_url, review_status, event_start_at, published_at)
values
  ('00000000-0000-4000-8000-0000000000c1', 'pgtap-view-published', '공개 행사', 'festival', '기관', 'https://example.com/pgtap-view-published', 'published', now(), now()),
  ('00000000-0000-4000-8000-0000000000c2', 'pgtap-view-pending', '대기 행사', 'festival', '기관', 'https://example.com/pgtap-view-pending', 'pending', now(), null);

set local role anon;
select is(
  public.increment_event_view('pgtap-view-published'),
  1,
  'anon은 공개 행사의 조회수를 1 올리고 새 조회수를 받는다'
);
select is(
  public.increment_event_view('pgtap-view-pending'),
  null,
  '공개 전 행사는 조회수를 올리지 않고 null을 돌려준다'
);
select is(
  public.increment_event_view('pgtap-view-missing'),
  null,
  '없는 행사는 null을 돌려준다'
);
reset role;

select is(
  (select view_count from public.events where slug = 'pgtap-view-pending'),
  0,
  '공개 전 행사의 실제 조회수는 그대로다'
);
select is(
  (select view_count from public.events where slug = 'pgtap-view-published'),
  1,
  '공개 행사의 실제 조회수만 올라간다'
);

select * from finish();
rollback;
