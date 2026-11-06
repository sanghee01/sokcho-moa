-- 조회수 RPC: 요청 제한을 거친 서버(service_role)만 공개 행사의 조회수를 1씩 올릴 수 있다.
-- 방문자(anon)·로그인 사용자가 PostgREST로 직접 부르면 요청 제한을 건너뛰므로 실행 권한이 없어야 한다.
-- API route는 RPC가 null을 돌려주면 "공개 행사 없음"(404)으로 응답하므로, 그 계약을 DB에서 확인한다.
begin;
select plan(11);

insert into public.events (id, slug, title, category, source_name, source_url, review_status, event_start_at, published_at, is_demo, updated_at)
values
  ('00000000-0000-4000-8000-0000000000c1', 'pgtap-view-published', '공개 행사', 'festival', '기관', 'https://example.com/pgtap-view-published', 'published', now(), now(), false, '2026-01-01T00:00:00Z'),
  ('00000000-0000-4000-8000-0000000000c2', 'pgtap-view-pending', '대기 행사', 'festival', '기관', 'https://example.com/pgtap-view-pending', 'pending', now(), null, false, '2026-01-01T00:00:00Z'),
  ('00000000-0000-4000-8000-0000000000c3', 'pgtap-view-demo', '샘플 행사', 'festival', '기관', 'https://example.com/pgtap-view-demo', 'published', now(), now(), true, '2026-01-01T00:00:00Z');

-- 거부: 요청 제한을 건너뛰는 직접 호출
set local role anon;
select throws_ok(
  $$select public.increment_event_view('pgtap-view-published')$$,
  '42501', null,
  'anon은 조회수 RPC를 직접 부를 수 없다'
);
reset role;
set local role authenticated;
select throws_ok(
  $$select public.increment_event_view('pgtap-view-published')$$,
  '42501', null,
  '로그인 사용자도 조회수 RPC를 직접 부를 수 없다'
);
reset role;

-- 허용: 서버(service_role)
set local role service_role;
select is(
  public.increment_event_view('pgtap-view-published'),
  1,
  'service_role은 공개 행사의 조회수를 1 올리고 새 조회수를 받는다'
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
select is(
  public.increment_event_view('pgtap-view-demo'),
  null,
  '샘플(is_demo) 행사는 조회수를 올리지 않고 null을 돌려준다'
);
reset role;

select is(
  (select view_count from public.events where slug = 'pgtap-view-pending'),
  0,
  '공개 전 행사의 실제 조회수는 그대로다'
);
select is(
  (select view_count from public.events where slug = 'pgtap-view-demo'),
  0,
  '샘플 행사의 실제 조회수는 그대로다'
);
select is(
  (select view_count from public.events where slug = 'pgtap-view-published'),
  1,
  '공개 행사의 실제 조회수만 올라간다'
);
-- updated_at은 관리자 목록 정렬에 쓰인다. 조회만으로 행사가 "방금 수정됨"이 되면 안 된다.
select is(
  (select updated_at from public.events where slug = 'pgtap-view-published'),
  '2026-01-01T00:00:00Z'::timestamptz,
  '조회수만 바뀌면 updated_at은 그대로다'
);
update public.events set title = '고친 공개 행사' where slug = 'pgtap-view-published';
select isnt(
  (select updated_at from public.events where slug = 'pgtap-view-published'),
  '2026-01-01T00:00:00Z'::timestamptz,
  '대조군: 내용을 고치면 updated_at이 갱신된다'
);

select * from finish();
rollback;
