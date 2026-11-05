-- 관리자 행사 쓰기: 저장·삭제는 RPC로만 하고, 삭제한 행사는 다시 들어오지 않는다.
begin;
select plan(12);

insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-4111-8111-111111111111', 'admin@example.com', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'visitor@example.com', 'authenticated', 'authenticated');
insert into public.admin_users (user_id, email) values ('11111111-1111-4111-8111-111111111111', 'admin@example.com');

set local role authenticated;

-- 관리자가 아닌 사용자
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$select public.create_event_with_source('{"slug":"pgtap-admin-event","title":"테스트 행사","category":"other","source_name":"기관","source_url":"https://example.com/pgtap-admin-event"}'::jsonb)$$,
  '42501', 'admin permission required',
  '관리자가 아니면 행사를 만들 수 없다'
);

-- 관리자
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is((select public.is_admin()), true, '허용 목록에 있는 사용자는 관리자다');
select isnt(
  (select public.create_event_with_source('{"slug":"pgtap-admin-event","title":"테스트 행사","category":"other","source_name":"기관","source_url":"https://example.com/pgtap-admin-event"}'::jsonb)),
  null,
  '관리자는 행사를 만들 수 있다(검수 대기로 저장)'
);
select is(
  (select review_status::text from public.events where slug = 'pgtap-admin-event'),
  'pending',
  '새 행사는 항상 검수 대기 상태다'
);
select throws_ok(
  $$delete from public.events where slug = 'pgtap-admin-event'$$,
  '42501', null,
  '관리자도 행사를 직접 delete할 수 없다'
);
select is(
  (select public.delete_event_and_exclude((select id from public.events where slug = 'pgtap-admin-event'), 'pgTAP')),
  'pgtap-admin-event',
  'RPC로 삭제하면 지운 행사의 slug를 돌려준다'
);
select ok(
  public.is_event_collection_excluded('pgtap-admin-event', 'https://example.com/pgtap-admin-event', ''),
  '삭제한 행사는 재수집 제외 목록에 남는다'
);
select throws_like(
  $$select public.create_event_with_source('{"slug":"pgtap-admin-event","title":"테스트 행사","category":"other","source_name":"기관","source_url":"https://example.com/pgtap-admin-event"}'::jsonb)$$,
  'event_collection_excluded%',
  '재수집 제외 중인 행사는 다시 만들 수 없다'
);
select is(
  (select public.release_event_collection_exclusion((select id from public.event_deletion_tombstones where original_slug = 'pgtap-admin-event'))),
  true,
  '관리자는 재수집 제외를 해제할 수 있다'
);

-- 수정 RPC: 행사·회차·출처를 한 번에 바꾼다
select lives_ok(
  $$select public.create_event_with_source('{"slug":"pgtap-admin-event","title":"테스트 행사","category":"other","source_name":"기관","source_url":"https://example.com/pgtap-admin-event"}'::jsonb)$$,
  '재수집 제외를 해제하면 같은 행사를 다시 만들 수 있다'
);
select lives_ok(
  $$select public.update_event_with_source(
    (select id from public.events where slug = 'pgtap-admin-event'),
    '{"slug":"pgtap-admin-event","title":"수정한 행사","category":"festival","audiences":["family"],"schedule_mode":"occurrences","performer_people":[],"performer_groups":[],"is_featured":false,"source_name":"기관","source_url":"https://example.com/pgtap-admin-event"}'::jsonb,
    '[{"starts_at":"2026-12-01T01:00:00Z","ends_at":null},{"starts_at":"2026-12-02T01:00:00Z","ends_at":null}]'::jsonb,
    now()
  )$$,
  '관리자는 행사와 회차를 한 번에 수정할 수 있다'
);
select is(
  (select count(*)::int from public.event_occurrences
   where event_id = (select id from public.events where slug = 'pgtap-admin-event')),
  2,
  '수정 RPC가 회차를 입력한 두 개로 바꾼다'
);

reset role;
select * from finish();
rollback;
