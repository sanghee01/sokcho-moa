-- 관리자 정책을 작업(select·insert·update·delete)별로 나눈 뒤에도 권한이 같은지 확인한다(20261106132943).
-- 관리자는 grant가 있는 작업을 모두 할 수 있고, 허용 목록에 없는 로그인 사용자는 아무것도 보거나 바꾸지 못한다.
-- RLS가 막는 update·delete는 오류 없이 0행이 되므로 바뀐 행 수를 확인한다.
begin;
select plan(30);

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
  ('81818181-8181-4181-8181-818181818181', 'policy-admin@example.com', 'authenticated', 'authenticated'),
  ('82828282-8282-4282-8282-828282828282', 'policy-visitor@example.com', 'authenticated', 'authenticated');
insert into public.admin_users (user_id, email)
values ('81818181-8181-4181-8181-818181818181', 'policy-admin@example.com');

insert into public.events (id, slug, title, category, source_name, source_url, review_status)
values ('00000000-0000-4000-8000-0000000008a1', 'pgtap-policy-pending', '대기 행사', 'festival', '기관', 'https://example.com/pgtap-policy-pending', 'pending');
insert into public.event_sources (id, event_id, provider, original_url)
values
  ('00000000-0000-4000-8000-0000000008b1', '00000000-0000-4000-8000-0000000008a1', 'pgtap', 'https://example.com/pgtap-policy-source-1'),
  ('00000000-0000-4000-8000-0000000008b2', '00000000-0000-4000-8000-0000000008a1', 'pgtap', 'https://example.com/pgtap-policy-source-2');
insert into public.event_occurrences (id, event_id, starts_at)
values
  ('00000000-0000-4000-8000-0000000008c1', '00000000-0000-4000-8000-0000000008a1', '2026-12-01T10:00:00+09:00'),
  ('00000000-0000-4000-8000-0000000008c2', '00000000-0000-4000-8000-0000000008a1', '2026-12-02T10:00:00+09:00');
insert into public.event_reports (id, title, body, source_url)
values
  ('00000000-0000-4000-8000-0000000008d1', '정책 제보 1', '정책 시험용 제보 본문입니다.', 'https://example.com/report-1'),
  ('00000000-0000-4000-8000-0000000008d2', '정책 제보 2', '정책 시험용 제보 본문입니다.', 'https://example.com/report-2');
insert into public.site_feedback (id, title, body)
values
  ('00000000-0000-4000-8000-0000000008e1', '정책 의견 1', '정책 시험용 의견 본문입니다.'),
  ('00000000-0000-4000-8000-0000000008e2', '정책 의견 2', '정책 시험용 의견 본문입니다.');
insert into public.places (id, slug, name, category, latitude, longitude, is_published)
values ('00000000-0000-4000-8000-0000000008f1', 'pgtap-policy-hidden-place', '숨긴 명소', 'landmark', 38.2, 128.6, false);
insert into public.event_deletion_tombstones (id, original_event_id, original_title, original_slug, event_snapshot, deleted_by)
values ('00000000-0000-4000-8000-000000000891', '00000000-0000-4000-8000-000000000899', '지운 행사', 'pgtap-policy-deleted', '{}', '81818181-8181-4181-8181-818181818181');
insert into public.event_deletion_identities (tombstone_id, identity_key, kind, source_namespace, identity_value)
values ('00000000-0000-4000-8000-000000000891', 'slug:pgtap-policy-deleted', 'slug', 'sokcho-moa', 'pgtap-policy-deleted');

-- 관리자: grant가 있는 작업은 모두 허용
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81818181-8181-4181-8181-818181818181","role":"authenticated"}', true);

select is((select count(*)::int from public.events where id = '00000000-0000-4000-8000-0000000008a1'), 1, '관리자는 대기 행사를 읽는다');
select lives_ok(
  $$insert into public.events (slug, title, category, source_name, source_url, review_status) values ('pgtap-policy-new', '새 행사', 'festival', '기관', 'https://example.com/pgtap-policy-new', 'pending')$$,
  '관리자는 행사를 만든다'
);
select is(pg_temp.affected_rows($$update public.events set title = '고친 행사' where id = '00000000-0000-4000-8000-0000000008a1'$$), 1, '관리자는 행사를 고친다');

select lives_ok(
  $$insert into public.event_sources (event_id, provider, original_url) values ('00000000-0000-4000-8000-0000000008a1', 'pgtap', 'https://example.com/pgtap-policy-source-3')$$,
  '관리자는 행사 출처를 만든다'
);
select is(pg_temp.affected_rows($$update public.event_sources set external_id = 'x' where id = '00000000-0000-4000-8000-0000000008b1'$$), 1, '관리자는 행사 출처를 고친다');
select is(pg_temp.affected_rows($$delete from public.event_sources where id = '00000000-0000-4000-8000-0000000008b2'$$), 1, '관리자는 행사 출처를 지운다');

select lives_ok(
  $$insert into public.event_occurrences (event_id, starts_at) values ('00000000-0000-4000-8000-0000000008a1', '2026-12-03T10:00:00+09:00')$$,
  '관리자는 회차를 만든다'
);
select is(pg_temp.affected_rows($$update public.event_occurrences set ends_at = starts_at + interval '1 hour' where id = '00000000-0000-4000-8000-0000000008c1'$$), 1, '관리자는 회차를 고친다');
select is(pg_temp.affected_rows($$delete from public.event_occurrences where id = '00000000-0000-4000-8000-0000000008c2'$$), 1, '관리자는 회차를 지운다');

select is((select count(*)::int from public.event_reports where id = '00000000-0000-4000-8000-0000000008d1'), 1, '관리자는 제보를 읽는다');
select is(pg_temp.affected_rows($$update public.event_reports set review_status = 'reviewed' where id = '00000000-0000-4000-8000-0000000008d1'$$), 1, '관리자는 제보 상태를 바꾼다');
select is(pg_temp.affected_rows($$delete from public.event_reports where id = '00000000-0000-4000-8000-0000000008d2'$$), 1, '관리자는 제보를 지운다');

select is((select count(*)::int from public.site_feedback where id = '00000000-0000-4000-8000-0000000008e1'), 1, '관리자는 의견을 읽는다');
select is(pg_temp.affected_rows($$update public.site_feedback set review_status = 'reviewed' where id = '00000000-0000-4000-8000-0000000008e1'$$), 1, '관리자는 의견 상태를 바꾼다');
select is(pg_temp.affected_rows($$delete from public.site_feedback where id = '00000000-0000-4000-8000-0000000008e2'$$), 1, '관리자는 의견을 지운다');

select is((select count(*)::int from public.places where id = '00000000-0000-4000-8000-0000000008f1'), 1, '관리자는 숨긴 명소를 읽는다');
select lives_ok(
  $$insert into public.places (slug, name, category, latitude, longitude) values ('pgtap-policy-new-place', '새 명소', 'landmark', 38.2, 128.6)$$,
  '관리자는 명소를 만든다'
);
select is(pg_temp.affected_rows($$update public.places set name = '고친 명소' where id = '00000000-0000-4000-8000-0000000008f1'$$), 1, '관리자는 명소를 고친다');
select is(pg_temp.affected_rows($$delete from public.places where slug = 'pgtap-policy-new-place'$$), 1, '관리자는 명소를 지운다');

select is((select count(*)::int from public.event_deletion_tombstones where id = '00000000-0000-4000-8000-000000000891'), 1, '관리자는 삭제 기록을 읽는다');
select is((select count(*)::int from public.event_deletion_identities where tombstone_id = '00000000-0000-4000-8000-000000000891'), 1, '관리자는 재수집 제외 식별 정보를 읽는다');

-- 허용 목록에 없는 로그인 사용자: 관리자 전용 데이터를 읽지도 바꾸지도 못한다
select set_config('request.jwt.claims', '{"sub":"82828282-8282-4282-8282-828282828282","role":"authenticated"}', true);

select is((select count(*)::int from public.events where id = '00000000-0000-4000-8000-0000000008a1'), 0, '일반 사용자는 대기 행사를 읽지 못한다');
select is(pg_temp.affected_rows($$update public.events set title = '침입' where id = '00000000-0000-4000-8000-0000000008a1'$$), 0, '일반 사용자는 행사를 고치지 못한다');
select throws_ok(
  $$insert into public.event_sources (event_id, provider, original_url) values ('00000000-0000-4000-8000-0000000008a1', 'pgtap', 'https://example.com/pgtap-policy-intrusion')$$,
  '42501', null,
  '일반 사용자는 행사 출처를 만들지 못한다'
);
select is(pg_temp.affected_rows($$delete from public.event_occurrences where id = '00000000-0000-4000-8000-0000000008c1'$$), 0, '일반 사용자는 회차를 지우지 못한다');
select is((select count(*)::int from public.event_reports), 0, '일반 사용자는 제보를 읽지 못한다');
select is((select count(*)::int from public.site_feedback), 0, '일반 사용자는 의견을 읽지 못한다');
select is((select count(*)::int from public.places where id = '00000000-0000-4000-8000-0000000008f1'), 0, '일반 사용자는 숨긴 명소를 읽지 못한다');
select is(pg_temp.affected_rows($$delete from public.places where id = '00000000-0000-4000-8000-0000000008f1'$$), 0, '일반 사용자는 명소를 지우지 못한다');
select is((select count(*)::int from public.event_deletion_tombstones), 0, '일반 사용자는 삭제 기록을 읽지 못한다');

select * from finish();
rollback;
