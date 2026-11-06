-- 공개 경계: 방문자(anon)와 일반 로그인 사용자가 무엇을 읽고 쓸 수 있는지 실제 권한으로 확인한다.
-- 이전에는 migration 파일에 해당 SQL 문장이 있는지만 문자열로 검사했다.
begin;
select plan(13);

insert into public.events (id, slug, title, category, source_name, source_url, review_status, event_start_at, published_at)
values
  ('00000000-0000-4000-8000-0000000000a1', 'pgtap-published', '공개 행사', 'festival', '기관', 'https://example.com/pgtap-published', 'published', now(), now()),
  ('00000000-0000-4000-8000-0000000000a2', 'pgtap-pending', '대기 행사', 'festival', '기관', 'https://example.com/pgtap-pending', 'pending', now(), null);

insert into auth.users (id, email, aud, role)
values ('22222222-2222-4222-8222-222222222222', 'visitor@example.com', 'authenticated', 'authenticated');
insert into public.event_reports (title, body, source_url)
values ('기존 제보', '이미 접수된 제보 본문입니다.', 'https://example.com/existing');

-- 방문자(anon)
set local role anon;
select results_eq(
  $$select slug from public.events where slug like 'pgtap-%' order by slug$$,
  array['pgtap-published'],
  'anon은 공개(published) 행사만 읽는다'
);
select throws_ok(
  $$insert into public.event_reports (title, body, source_url) values ('제보 제목', '본문을 열 글자 이상 적습니다.', 'https://example.com')$$,
  '42501', null,
  'anon은 제보를 DB에 직접 저장할 수 없다(server action만 저장)'
);
select throws_ok(
  $$insert into public.site_feedback (title, body) values ('의견 제목', '본문을 열 글자 이상 적습니다.')$$,
  '42501', null,
  'anon은 의견을 DB에 직접 저장할 수 없다'
);
-- 제보 select 권한(grant)은 Supabase 기본값으로 열려 있다. 막는 것은 RLS라서 오류 대신 0행이 된다.
select is_empty($$select id from public.event_reports$$, 'anon에게는 RLS 때문에 제보가 하나도 보이지 않는다');
-- 행사 쓰기 권한은 anon에게서 회수했다. RLS 0행이 아니라 권한 오류로 막힌다.
select throws_ok(
  $$update public.events set title = '변조' where slug = 'pgtap-published'$$,
  '42501', null,
  'anon의 행사 수정 요청은 권한 오류로 막히고'
);
reset role;
select is(
  (select title from public.events where slug = 'pgtap-published'),
  '공개 행사',
  '실제로 아무 행도 바뀌지 않는다'
);

-- 일반 로그인 사용자(관리자 아님)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is((select public.is_admin()), false, '허용 목록에 없는 사용자는 관리자가 아니다');
select throws_ok(
  $$insert into public.event_reports (title, body, source_url) values ('제보 제목', '본문을 열 글자 이상 적습니다.', 'https://example.com')$$,
  '42501', null,
  '로그인 사용자도 제보를 직접 저장할 수 없다'
);
select results_eq(
  $$select slug from public.events where slug like 'pgtap-%' order by slug$$,
  array['pgtap-published'],
  '관리자가 아닌 로그인 사용자도 공개 행사만 읽는다'
);
reset role;

-- 서버(service_role): 방문자 제출을 저장하는 유일한 경로
set local role service_role;
select lives_ok(
  $$insert into public.event_reports (title, body, source_url) values ('제보 제목', '본문을 열 글자 이상 적습니다.', 'https://example.com')$$,
  'service_role은 검증된 제보를 저장할 수 있다'
);
reset role;

-- schema 상태
select col_not_null('public', 'event_reports', 'source_url', '제보 링크는 필수다');
select is(
  (select proconfig from pg_proc where oid = 'public.is_admin()'::regprocedure),
  array['search_path=""'],
  'security definer 함수 is_admin은 빈 search_path로 고정돼 있다'
);
select hasnt_function('public', 'replace_event_occurrences', '쓰지 않는 회차 교체 RPC는 지웠다');

select * from finish();
rollback;
