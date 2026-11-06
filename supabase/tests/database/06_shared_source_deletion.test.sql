-- 같은 출처를 쓰는 행사 삭제: events.source_url은 unique가 아니라서 한 공고 URL에 행사가 여러 개 걸릴 수 있다.
-- 그중 하나를 지워도 남은 행사는 계속 수정·공개할 수 있어야 하고, 다른 행사가 쓰지 않는 출처는 계속 재수집을 막아야 한다.
begin;
select plan(9);

insert into auth.users (id, email, aud, role)
values ('61616161-6161-4161-8161-616161616161', 'shared-admin@example.com', 'authenticated', 'authenticated');
insert into public.admin_users (user_id, email)
values ('61616161-6161-4161-8161-616161616161', 'shared-admin@example.com');

-- A와 B는 같은 공고 URL(같은 external_id)을 쓰고, C는 혼자 쓰는 URL이다.
insert into public.events (id, slug, title, category, source_name, source_url, review_status, event_start_at)
values
  ('00000000-0000-4000-8000-0000000006a1', 'pgtap-shared-a', '같은 공고 행사 A', 'festival', '기관', 'https://example.com/board/view?idx=601', 'pending', now()),
  ('00000000-0000-4000-8000-0000000006a2', 'pgtap-shared-b', '같은 공고 행사 B', 'festival', '기관', 'https://example.com/board/view?idx=601', 'pending', now()),
  ('00000000-0000-4000-8000-0000000006a3', 'pgtap-unique-c', '혼자 쓰는 출처 행사', 'festival', '기관', 'https://example.com/board/view?idx=602', 'pending', now());
insert into public.event_sources (event_id, provider, original_url, external_id)
values
  ('00000000-0000-4000-8000-0000000006a1', '기관', 'https://example.com/board/view?idx=601', '601'),
  ('00000000-0000-4000-8000-0000000006a2', '기관', 'https://example.com/board/view?idx=601', '601'),
  ('00000000-0000-4000-8000-0000000006a3', '기관', 'https://example.com/board/view?idx=602', '602');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"61616161-6161-4161-8161-616161616161","role":"authenticated"}', true);

select is(
  (select public.delete_event_and_exclude('00000000-0000-4000-8000-0000000006a1', 'pgTAP 중복')),
  'pgtap-shared-a',
  '같은 출처를 쓰는 행사 중 하나를 삭제한다'
);
select ok(
  public.is_event_collection_excluded('pgtap-shared-a', null, null),
  '삭제한 행사의 slug는 재수집 제외 목록에 남는다'
);
select ok(
  not public.is_event_collection_excluded(null, 'https://example.com/board/view?idx=601', '601'),
  '다른 행사가 아직 쓰는 출처 URL·external_id는 재수집 제외로 기록하지 않는다'
);
select lives_ok(
  $$select public.update_event_with_source(
    '00000000-0000-4000-8000-0000000006a2',
    '{"slug":"pgtap-shared-b","title":"수정한 행사 B","category":"festival","event_start_at":"2026-12-01T01:00:00Z","source_name":"기관","source_url":"https://example.com/board/view?idx=601"}'::jsonb,
    '[]'::jsonb,
    now()
  )$$,
  '남은 행사 B는 같은 출처로 계속 수정할 수 있다'
);
select lives_ok(
  $$update public.events set review_status = 'published', published_at = now() where id = '00000000-0000-4000-8000-0000000006a2'$$,
  '남은 행사 B는 공개할 수 있다'
);

-- 대조군: 다른 행사가 쓰지 않는 출처는 삭제 후 재수집을 막는다.
select is(
  (select public.delete_event_and_exclude('00000000-0000-4000-8000-0000000006a3', 'pgTAP 단독')),
  'pgtap-unique-c',
  '혼자 쓰는 출처의 행사를 삭제한다'
);
select ok(
  public.is_event_collection_excluded(null, 'https://example.com/board/view?idx=602', '602'),
  '다른 행사가 쓰지 않는 출처는 재수집 제외로 기록한다'
);
select throws_like(
  $$select public.create_event_with_source('{"slug":"pgtap-unique-c-again","title":"다시 수집한 행사","category":"festival","source_name":"기관","source_url":"https://example.com/board/view?idx=602"}'::jsonb)$$,
  'event_collection_excluded%',
  '삭제한 단독 출처는 새 slug로도 다시 만들 수 없다'
);
reset role;

select is(
  (select review_status::text from public.events where id = '00000000-0000-4000-8000-0000000006a2'),
  'published',
  '남은 행사 B가 실제로 공개됐다'
);

select * from finish();
rollback;
