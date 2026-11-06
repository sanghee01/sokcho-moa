-- Data API 역할의 기본 권한 정리: Supabase가 기본으로 준 넓은 table·함수 권한 중 쓰지 않는 것을 회수했는지 확인한다.
-- RLS가 막아도 권한(grant)이 남아 있으면 BEFORE trigger(security definer)가 RLS보다 먼저 실행되고,
-- TRUNCATE는 RLS를 아예 거치지 않는다. 그래서 거부는 0행이 아니라 권한 오류(42501)여야 한다.
begin;
select plan(20);

insert into auth.users (id, email, aud, role)
values
  ('71717171-7171-4171-8171-717171717171', 'grants-admin@example.com', 'authenticated', 'authenticated'),
  ('72727272-7272-4272-8272-727272727272', 'grants-visitor@example.com', 'authenticated', 'authenticated');
insert into public.admin_users (user_id, email)
values ('71717171-7171-4171-8171-717171717171', 'grants-admin@example.com');

insert into public.events (id, slug, title, category, source_name, source_url, review_status, event_start_at, published_at)
values ('00000000-0000-4000-8000-0000000007a1', 'pgtap-grants-published', '공개 행사', 'festival', '기관', 'https://example.com/pgtap-grants-published', 'published', now(), now());
insert into public.places (id, slug, name, category, latitude, longitude, is_published)
values ('00000000-0000-4000-8000-0000000007b1', 'pgtap-grants-place', '공개 명소', 'landmark', 38.2, 128.6, true);
insert into storage.objects (bucket_id, name)
values ('event-images', 'events/pgtap-grants.webp');

-- 방문자(anon): 쓰기 권한이 없다
set local role anon;
-- 형식이 잘못된 URL은 tombstone trigger가 22023으로 거부한다. 42501이 나오면 trigger보다 권한 검사가 먼저 막은 것이다.
select throws_ok(
  $$insert into public.events (slug, title, category, source_name, source_url) values ('pgtap-grants-anon', '행사', 'festival', '기관', 'not-a-url')$$,
  '42501', null,
  'anon의 행사 insert는 tombstone trigger에 닿기 전에 권한 오류로 막힌다'
);
select throws_ok(
  $$insert into public.event_sources (event_id, provider, original_url) values ('00000000-0000-4000-8000-0000000007a1', '기관', 'not-a-url')$$,
  '42501', null,
  'anon의 출처 insert도 trigger 전에 권한 오류로 막힌다'
);
select throws_ok(
  $$insert into public.event_occurrences (event_id, starts_at) values ('00000000-0000-4000-8000-0000000007a1', now())$$,
  '42501', null,
  'anon은 회차를 추가할 수 없다'
);
select throws_ok(
  $$update public.places set name = '변조' where slug = 'pgtap-grants-place'$$,
  '42501', null,
  'anon은 명소를 수정할 수 없다'
);
select throws_ok(
  $$select user_id from public.admin_users$$,
  '42501', null,
  'anon은 관리자 허용 목록을 읽을 수 없다'
);
select is_empty(
  $$select name from storage.objects where bucket_id = 'event-images'$$,
  'anon은 행사 이미지 bucket의 파일 목록을 볼 수 없다(공개 URL로만 읽는다)'
);
select results_eq(
  $$select slug from public.events where slug = 'pgtap-grants-published'$$,
  array['pgtap-grants-published'],
  '대조군: anon은 공개 행사를 계속 읽는다'
);
select results_eq(
  $$select name from public.places where slug = 'pgtap-grants-place'$$,
  array['공개 명소'],
  '대조군: anon은 공개 명소를 계속 읽는다'
);
reset role;

-- 관리자가 아닌 로그인 사용자
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"72727272-7272-4272-8272-727272727272","role":"authenticated"}', true);
select throws_ok(
  $$select user_id from public.admin_users$$,
  '42501', null,
  '로그인 사용자도 관리자 허용 목록을 직접 읽을 수 없다'
);
select is((select public.is_admin()), false, '대조군: is_admin()은 계속 호출할 수 있다');
select is_empty(
  $$select name from storage.objects where bucket_id = 'event-images'$$,
  '관리자가 아닌 로그인 사용자도 행사 이미지 파일 목록을 볼 수 없다'
);

-- 관리자
select set_config('request.jwt.claims', '{"sub":"71717171-7171-4171-8171-717171717171","role":"authenticated"}', true);
select is((select public.is_admin()), true, '관리자는 admin_users를 직접 읽지 않고도 is_admin()으로 확인된다');
select results_eq(
  $$select name from storage.objects where bucket_id = 'event-images' and name = 'events/pgtap-grants.webp'$$,
  array['events/pgtap-grants.webp'],
  '관리자는 행사 이미지 파일을 조회할 수 있다(삭제에 필요)'
);
select lives_ok(
  $$insert into public.places (slug, name, category, latitude, longitude, is_published) values ('pgtap-grants-new-place', '새 명소', 'landmark', 38.2, 128.6, false)$$,
  '대조군: 관리자는 명소를 추가할 수 있다'
);
select throws_ok(
  $$truncate public.event_occurrences$$,
  '42501', null,
  '관리자 세션도 RLS를 거치지 않는 truncate는 할 수 없다'
);
reset role;

-- 함수 기본 권한: 새로 만드는 함수는 명시적으로 grant하기 전까지 API 역할이 실행할 수 없다.
create function public.pgtap_new_function_default_privilege()
returns integer
language sql
as $$ select 1 $$;
select ok(
  not has_function_privilege('anon', 'public.pgtap_new_function_default_privilege()', 'execute'),
  '새 함수는 anon에게 기본 실행 권한이 없다'
);
select ok(
  not has_function_privilege('authenticated', 'public.pgtap_new_function_default_privilege()', 'execute'),
  '새 함수는 authenticated에게 기본 실행 권한이 없다'
);
select ok(
  has_function_privilege('anon', 'public.is_admin()', 'execute'),
  '대조군: RLS 정책이 쓰는 is_admin()은 anon도 계속 실행할 수 있다'
);

-- truncate는 RLS를 거치지 않으므로 마지막에 확인한다(권한이 남아 있으면 이후 확인이 의미 없어진다).
set local role anon;
select throws_ok(
  $$truncate public.events cascade$$,
  '42501', null,
  'anon은 행사 table을 truncate할 수 없다'
);
reset role;
select is(
  (select count(*)::int from public.events where slug = 'pgtap-grants-published'),
  1,
  '행사가 지워지지 않았다'
);

select * from finish();
rollback;
