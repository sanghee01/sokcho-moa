-- 공지(notices) 권한과 즐길거리용 places 값의 제약을 확인한다(20261121050439).
-- 방문자는 공개한 공지만 읽고 쓰지 못한다. 관리자는 읽기·추가·수정·삭제를 모두 한다.
-- 허용 목록에 없는 로그인 사용자는 숨긴 공지를 보거나 바꾸지 못한다(RLS 거부는 0행이라 행 수로 확인한다).
begin;
select plan(21);

create function pg_temp.affected_rows(statement text)
returns integer
language plpgsql
as $$
declare
  affected integer;
begin
  execute statement;
  get diagnostics affected = row_count;
  return affected;
end;
$$;
grant execute on function pg_temp.affected_rows(text) to authenticated;

insert into auth.users (id, email, aud, role)
values
  ('91919191-9191-4191-8191-919191919191', 'notice-admin@example.com', 'authenticated', 'authenticated'),
  ('92929292-9292-4292-8292-929292929292', 'notice-visitor@example.com', 'authenticated', 'authenticated');
insert into public.admin_users (user_id, email)
values ('91919191-9191-4191-8191-919191919191', 'notice-admin@example.com');

insert into public.notices (id, kind, title, body, is_published, published_at)
values
  ('00000000-0000-4000-8000-0000000009a1', 'notice', '공개 공지', '공개한 공지 본문입니다.', true, now()),
  ('00000000-0000-4000-8000-0000000009a2', 'update', '숨긴 공지', '아직 공개하지 않은 글입니다.', false, null);

-- 제약: 공개한 글에는 공개 시각이 있어야 하고, 종류·분류·태그·운영 상태는 정해진 값만 받는다.
select throws_ok(
  $$insert into public.notices (title, body, is_published) values ('시각 없음', '본문', true)$$,
  '23514', null,
  '공개 시각 없이 공개 상태로 저장할 수 없다'
);
select throws_ok(
  $$insert into public.notices (kind, title, body) values ('event', '종류 오류', '본문')$$,
  '23514', null,
  '정해진 종류가 아닌 공지는 저장할 수 없다'
);
select throws_ok(
  $$insert into public.places (slug, name, category, latitude, longitude, activity_category) values ('pgtap-activity-bad-category', '명소', 'landmark', 38.2, 128.6, 'cafe')$$,
  '23514', null,
  '정해진 즐길거리 분류가 아니면 저장할 수 없다'
);
select throws_ok(
  $$insert into public.places (slug, name, category, latitude, longitude, tags) values ('pgtap-activity-bad-tag', '명소', 'landmark', 38.2, 128.6, array['indoor', 'pets'])$$,
  '23514', null,
  '정해진 태그가 아닌 값이 섞이면 저장할 수 없다'
);
select throws_ok(
  $$insert into public.places (slug, name, category, latitude, longitude, operation_status) values ('pgtap-activity-bad-status', '명소', 'landmark', 38.2, 128.6, 'unknown')$$,
  '23514', null,
  '정해진 운영 상태가 아니면 저장할 수 없다'
);
select lives_ok(
  $$insert into public.places (slug, name, category, latitude, longitude, activity_category, tags, operation_status, verified_on) values ('pgtap-activity-ok', '명소', '전시관', 38.2, 128.6, 'exhibition', array['indoor', 'kids'], 'seasonal_closed', '2026-11-21')$$,
  '대조군: 정해진 값이면 즐길거리 값을 저장한다'
);

-- 사진을 싣는 장소는 출처를 함께 적어야 한다(20261121064211).
select throws_ok(
  $$insert into public.places (slug, name, category, latitude, longitude, image_url) values ('pgtap-photo-no-credit', '명소', 'landmark', 38.2, 128.6, '/places/sample.webp')$$,
  '23514', null,
  '출처 없이 사진 주소만 저장할 수 없다'
);
select lives_ok(
  $$insert into public.places (slug, name, category, latitude, longitude, image_url, image_credit, image_source_url) values ('pgtap-photo-ok', '명소', 'landmark', 38.2, 128.6, '/places/sample.webp', '사진: 시험, CC0', 'https://example.com/photo')$$,
  '대조군: 출처를 함께 적으면 사진을 저장한다'
);

-- 방문자(anon)
set local role anon;
select results_eq(
  -- seed의 샘플 공지와 섞이지 않게 이 test가 넣은 두 글만 본다.
  $$select title from public.notices where id in ('00000000-0000-4000-8000-0000000009a1', '00000000-0000-4000-8000-0000000009a2') order by title$$,
  array['공개 공지'],
  'anon은 공개한 공지만 읽는다'
);
select throws_ok(
  $$insert into public.notices (title, body) values ('침입', '본문')$$,
  '42501', null,
  'anon은 공지를 추가할 수 없다'
);
select throws_ok(
  $$update public.notices set title = '변조' where id = '00000000-0000-4000-8000-0000000009a1'$$,
  '42501', null,
  'anon은 공지를 수정할 수 없다'
);
select throws_ok(
  $$delete from public.notices where id = '00000000-0000-4000-8000-0000000009a1'$$,
  '42501', null,
  'anon은 공지를 지울 수 없다'
);
reset role;

-- 관리자
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"91919191-9191-4191-8191-919191919191","role":"authenticated"}', true);
select is((select count(*)::int from public.notices where id = '00000000-0000-4000-8000-0000000009a2'), 1, '관리자는 숨긴 공지를 읽는다');
select lives_ok(
  $$insert into public.notices (id, title, body) values ('00000000-0000-4000-8000-0000000009a3', '새 공지', '관리자가 쓴 글입니다.')$$,
  '관리자는 공지를 만든다'
);
select is(pg_temp.affected_rows($$update public.notices set is_published = true, published_at = now() where id = '00000000-0000-4000-8000-0000000009a3'$$), 1, '관리자는 공지를 공개로 바꾼다');
select is(pg_temp.affected_rows($$delete from public.notices where id = '00000000-0000-4000-8000-0000000009a3'$$), 1, '관리자는 공지를 지운다');

-- 허용 목록에 없는 로그인 사용자
select set_config('request.jwt.claims', '{"sub":"92929292-9292-4292-8292-929292929292","role":"authenticated"}', true);
select is((select count(*)::int from public.notices where id = '00000000-0000-4000-8000-0000000009a2'), 0, '일반 사용자는 숨긴 공지를 읽지 못한다');
select is((select count(*)::int from public.notices where id = '00000000-0000-4000-8000-0000000009a1'), 1, '대조군: 일반 사용자도 공개한 공지는 읽는다');
select throws_ok(
  $$insert into public.notices (title, body) values ('침입', '본문')$$,
  '42501', null,
  '일반 사용자는 공지를 만들지 못한다'
);
select is(pg_temp.affected_rows($$update public.notices set title = '침입' where id = '00000000-0000-4000-8000-0000000009a1'$$), 0, '일반 사용자는 공지를 고치지 못한다');
select is(pg_temp.affected_rows($$delete from public.notices where id = '00000000-0000-4000-8000-0000000009a1'$$), 0, '일반 사용자는 공지를 지우지 못한다');

select * from finish();
rollback;
