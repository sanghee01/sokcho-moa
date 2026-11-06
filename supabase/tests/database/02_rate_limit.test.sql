-- 방문자 제출 요청 제한: 서버만 호출할 수 있고, 창 안에서 한도를 넘으면 거부한다.
begin;
select plan(7);

select ok(
  not has_function_privilege('anon', 'public.consume_public_submission_rate_limit(text,text,integer,integer)', 'execute'),
  'anon은 요청 제한 함수를 직접 부를 수 없다'
);
select ok(
  not has_function_privilege('authenticated', 'public.consume_public_submission_rate_limit(text,text,integer,integer)', 'execute'),
  '로그인 사용자도 요청 제한 함수를 직접 부를 수 없다'
);

set local role service_role;
select is(
  (select allowed from public.consume_public_submission_rate_limit('event_report', repeat('a', 64), 2, 600)),
  true, '첫 요청은 허용한다'
);
select is(
  (select allowed from public.consume_public_submission_rate_limit('event_report', repeat('a', 64), 2, 600)),
  true, '한도(2회) 안의 두 번째 요청도 허용한다'
);
select is(
  (select allowed from public.consume_public_submission_rate_limit('event_report', repeat('a', 64), 2, 600)),
  false, '한도를 넘은 세 번째 요청은 거부한다'
);
select is(
  (select allowed from public.consume_public_submission_rate_limit('event_view', repeat('b', 64), 1, 600)),
  true, '조회수 기록(event_view)도 요청 제한 scope로 받는다'
);
select throws_ok(
  $$select * from public.consume_public_submission_rate_limit('unknown_scope', repeat('c', 64), 1, 600)$$,
  '22023', 'invalid rate-limit scope',
  '정해지지 않은 scope는 거부한다'
);
reset role;

select * from finish();
rollback;
