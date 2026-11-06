-- 권한 상승 차단: 로그인했지만 관리자 허용 목록(admin_users)에 없는 사용자가 table 직접 쓰기나
-- 관리자 RPC로 관리자 권한·공개 상태·운영 데이터를 바꿀 수 없는지 확인한다.
-- RLS가 막는 update·delete는 오류 없이 0행이 되므로 바뀐 행 수와 실제 데이터를 함께 확인한다.
begin;
select plan(28);

-- 실행한 쓰기 문장이 바꾼 행 수. 호출한 역할(security invoker)의 권한·RLS로 실행된다.
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

insert into auth.users (id, email, aud, role)
values
  ('41414141-4141-4141-8141-414141414141', 'escalation-admin@example.com', 'authenticated', 'authenticated'),
  ('42424242-4242-4242-8242-424242424242', 'escalation-visitor@example.com', 'authenticated', 'authenticated');
insert into public.admin_users (user_id, email)
values ('41414141-4141-4141-8141-414141414141', 'escalation-admin@example.com');

insert into public.events (id, slug, title, category, source_name, source_url, review_status, event_start_at, published_at)
values
  ('00000000-0000-4000-8000-0000000004a1', 'pgtap-esc-published', '공개 행사', 'festival', '기관', 'https://example.com/pgtap-esc-published', 'published', now(), now()),
  ('00000000-0000-4000-8000-0000000004a2', 'pgtap-esc-pending', '대기 행사', 'festival', '기관', 'https://example.com/pgtap-esc-pending', 'pending', now(), null),
  ('00000000-0000-4000-8000-0000000004a3', 'pgtap-esc-deleted', '삭제할 행사', 'festival', '기관', 'https://example.com/pgtap-esc-deleted', 'pending', now(), null);
insert into public.places (id, slug, name, category, latitude, longitude, is_published)
values ('00000000-0000-4000-8000-0000000004b1', 'pgtap-esc-place', '공개 명소', 'landmark', 38.2, 128.6, true);
insert into public.event_reports (id, title, body, source_url)
values ('00000000-0000-4000-8000-0000000004c1', '기존 제보', '이미 접수된 제보 본문입니다.', 'https://example.com/report');
insert into public.site_feedback (id, title, body)
values ('00000000-0000-4000-8000-0000000004d1', '기존 의견', '이미 접수된 의견 본문입니다.');

-- 관리자: 재수집 제외 해제 시험에 쓸 삭제 기록(tombstone)을 만든다. 허용 경로가 동작함을 보여 주는 대조군이기도 하다.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"41414141-4141-4141-8141-414141414141","role":"authenticated"}', true);
select is(
  (select public.delete_event_and_exclude('00000000-0000-4000-8000-0000000004a3', 'pgTAP')),
  'pgtap-esc-deleted',
  '대조군: 관리자는 삭제 RPC를 호출할 수 있다'
);

-- 관리자가 아닌 로그인 사용자
select set_config('request.jwt.claims', '{"sub":"42424242-4242-4242-8242-424242424242","role":"authenticated"}', true);
select is((select public.is_admin()), false, '허용 목록에 없는 사용자는 관리자가 아니다');

-- 관리자 허용 목록
select throws_ok(
  $$insert into public.admin_users (user_id, email) values ('42424242-4242-4242-8242-424242424242', 'escalation-visitor@example.com')$$,
  '42501', null,
  '자기 자신을 관리자 허용 목록에 넣을 수 없다'
);

-- 행사 공개 상태
select is(
  pg_temp.affected_rows($$update public.events set review_status = 'rejected', published_at = null where slug = 'pgtap-esc-published'$$),
  0,
  '공개 행사를 반려로 바꿀 수 없다(0행)'
);
select is(
  pg_temp.affected_rows($$update public.events set review_status = 'published', published_at = now() where slug = 'pgtap-esc-pending'$$),
  0,
  '검수 대기 행사를 직접 공개할 수 없다(0행)'
);

-- 명소
select throws_ok(
  $$insert into public.places (slug, name, category, latitude, longitude, is_published) values ('pgtap-esc-new-place', '새 명소', 'landmark', 38.2, 128.6, true)$$,
  '42501', null,
  '명소를 추가할 수 없다'
);
select is(
  pg_temp.affected_rows($$update public.places set name = '변조' where slug = 'pgtap-esc-place'$$),
  0,
  '공개 명소를 수정할 수 없다(0행)'
);
select is(
  pg_temp.affected_rows($$delete from public.places where slug = 'pgtap-esc-place'$$),
  0,
  '공개 명소를 삭제할 수 없다(0행)'
);

-- 방문자 제보
select throws_ok(
  $$insert into public.event_reports (title, body, source_url) values ('제보 제목', '본문을 열 글자 이상 적습니다.', 'https://example.com')$$,
  '42501', null,
  '제보를 직접 저장할 수 없다'
);
select is(
  pg_temp.affected_rows($$update public.event_reports set review_status = 'reviewed' where id = '00000000-0000-4000-8000-0000000004c1'$$),
  0,
  '제보 처리 상태를 바꿀 수 없다(0행)'
);
select is(
  pg_temp.affected_rows($$delete from public.event_reports where id = '00000000-0000-4000-8000-0000000004c1'$$),
  0,
  '제보를 삭제할 수 없다(0행)'
);

-- 서비스 의견
select throws_ok(
  $$insert into public.site_feedback (title, body) values ('의견 제목', '본문을 열 글자 이상 적습니다.')$$,
  '42501', null,
  '의견을 직접 저장할 수 없다'
);
select is(
  pg_temp.affected_rows($$update public.site_feedback set review_status = 'reviewed' where id = '00000000-0000-4000-8000-0000000004d1'$$),
  0,
  '의견 처리 상태를 바꿀 수 없다(0행)'
);
select is(
  pg_temp.affected_rows($$delete from public.site_feedback where id = '00000000-0000-4000-8000-0000000004d1'$$),
  0,
  '의견을 삭제할 수 없다(0행)'
);

-- 관리자 RPC(security definer라 RLS를 우회하므로 함수 안의 is_admin() 검사가 유일한 방어선이다)
select throws_ok(
  $$select public.update_event_with_source(
    '00000000-0000-4000-8000-0000000004a2',
    '{"slug":"pgtap-esc-pending","title":"변조","category":"festival","review_status":"published","source_name":"기관","source_url":"https://example.com/pgtap-esc-pending"}'::jsonb,
    '[]'::jsonb,
    now()
  )$$,
  '42501', 'admin permission required',
  '행사 수정 RPC를 호출할 수 없다'
);
select throws_ok(
  $$select public.delete_event_and_exclude('00000000-0000-4000-8000-0000000004a1', '권한 상승 시도')$$,
  '42501', 'admin permission required',
  '행사 삭제 RPC를 호출할 수 없다'
);
select throws_ok(
  $$select public.release_event_collection_exclusion((select id from public.event_deletion_tombstones where original_slug = 'pgtap-esc-deleted'))$$,
  '42501', 'admin permission required',
  '재수집 제외 해제 RPC를 호출할 수 없다'
);
reset role;

-- 실제 데이터가 그대로인지 RLS 밖(테스트 소유자)에서 확인한다.
select is(
  (select count(*)::int from public.admin_users where user_id = '42424242-4242-4242-8242-424242424242'),
  0,
  '허용 목록에 방문자가 추가되지 않았다'
);
select results_eq(
  $$select slug, review_status::text, title from public.events where slug in ('pgtap-esc-published', 'pgtap-esc-pending') order by slug$$,
  $$values ('pgtap-esc-pending', 'pending', '대기 행사'), ('pgtap-esc-published', 'published', '공개 행사')$$,
  '행사의 공개 상태와 내용이 바뀌지 않았고 삭제되지도 않았다'
);
select is(
  (select count(*)::int from public.places where slug like 'pgtap-esc-%'),
  1,
  '명소가 추가·삭제되지 않았다'
);
select is((select name from public.places where slug = 'pgtap-esc-place'), '공개 명소', '명소 내용이 바뀌지 않았다');
select is(
  (select review_status from public.event_reports where id = '00000000-0000-4000-8000-0000000004c1'),
  'pending',
  '제보가 남아 있고 처리 상태도 그대로다'
);
select is(
  (select review_status from public.site_feedback where id = '00000000-0000-4000-8000-0000000004d1'),
  'pending',
  '의견이 남아 있고 처리 상태도 그대로다'
);
select is(
  (select released_at from public.event_deletion_tombstones where original_slug = 'pgtap-esc-deleted'),
  null,
  '재수집 제외가 해제되지 않았다'
);

-- 대조군: 같은 쓰기를 관리자가 하면 실제로 반영된다. 위의 0행이 잘못된 조건 때문이 아니라 권한 때문임을 보여 준다.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"41414141-4141-4141-8141-414141414141","role":"authenticated"}', true);
select is(
  pg_temp.affected_rows($$update public.events set review_status = 'published', published_at = now() where slug = 'pgtap-esc-pending'$$),
  1,
  '대조군: 관리자는 검수 대기 행사를 공개할 수 있다(1행)'
);
select is(
  pg_temp.affected_rows($$update public.event_reports set review_status = 'reviewed' where id = '00000000-0000-4000-8000-0000000004c1'$$),
  1,
  '대조군: 관리자는 제보 처리 상태를 바꿀 수 있다(1행)'
);
select is(
  pg_temp.affected_rows($$delete from public.places where slug = 'pgtap-esc-place'$$),
  1,
  '대조군: 관리자는 명소를 삭제할 수 있다(1행)'
);
select is(
  (select public.release_event_collection_exclusion((select id from public.event_deletion_tombstones where original_slug = 'pgtap-esc-deleted'))),
  true,
  '대조군: 관리자는 재수집 제외를 해제할 수 있다'
);
reset role;

select * from finish();
rollback;
