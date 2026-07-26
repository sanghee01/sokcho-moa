-- 2026-07-21 공식 원문 재검증 기준 속초 행사 검토 후보 9건.
--
-- 실행 위치: Supabase SQL Editor
-- 공개 여부: 새 행은 모두 pending이며, 이 파일은 어떤 행사도 published로 바꾸지 않는다.
-- 멱등성: 같은 slug의 pending/rejected 행은 최신 검증 내용으로 갱신하고 회차를 재구성한다.
-- 안전장치: 같은 slug가 이미 published이면 캐시를 우회해 공개 데이터를 바꾸지 않도록 전체 트랜잭션을 중단한다.
--
-- 중요:
-- 1. 여름방학 늘봄학교는 신청 링크·대상·비용이 달라 과목별 2개 행사로 분리했다.
-- 2. 공식 공지에 요금이 없는 행사는 is_free를 null로 유지했다. "안내 없음"은 "무료"가 아니다.
-- 3. 날짜만 공개된 행사는 임의 시간을 만들지 않고 00:00~23:59:59로 저장했다.
-- 4. 이 파일을 migration 디렉터리가 아닌 review 디렉터리에 둔 것은 자동 운영 반영을 막기 위해서다.

begin;

do $review_guard$
begin
  if exists (
    select 1
    from public.events
    where slug in (
      '2026-summer-neulbom-ai-paibo',
      '2026-summer-neulbom-baking',
      '2026-short-form-60-seconds-story',
      '2026-july-reading-quiz-book-knows',
      '2026-daepo-love',
      '2026-cheongcho-water-playground',
      '2026-silent-dj-party',
      '2026-sea-of-light-summer',
      '2026-lighthouse-beach-marine-sports'
    )
      and review_status = 'published'
  ) then
    raise exception '검토 SQL 중단: 같은 slug의 published 행이 있습니다. 공개 행사는 관리자 화면에서 수정해 캐시를 갱신하세요.';
  end if;
end
$review_guard$;

insert into public.events (
  id,
  slug,
  title,
  summary,
  description,
  category,
  audiences,
  event_start_at,
  event_end_at,
  operating_hours,
  application_start_at,
  application_end_at,
  location_name,
  address,
  latitude,
  longitude,
  price_text,
  is_free,
  organizer,
  contact,
  official_url,
  application_url,
  image_url,
  source_name,
  source_url,
  review_status,
  is_featured,
  is_demo,
  last_verified_at,
  published_at,
  location_source_url,
  location_verified_at,
  schedule_mode
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '2026-summer-neulbom-ai-paibo',
    '2026 여름방학 늘봄학교: 인공지능 파이보 로봇코딩',
    '초등 4~6학년 10명을 대상으로 파이보 로봇과 인공지능 코딩을 배우는 8회 과정입니다.',
    '개인 태블릿 또는 노트북을 지참해야 합니다. 모집 정원의 70% 미만이면 폐강될 수 있으며 운영 일정은 사정에 따라 바뀔 수 있습니다. 공식 첨부 안내문에는 수강료가 따로 적혀 있지 않습니다.',
    'education',
    array['child'],
    '2026-07-27T10:00:00+09:00',
    '2026-08-05T11:30:00+09:00',
    '7월 27일~8월 5일 10:00~11:30, 총 8회(공식 안내에 개별 회차 날짜는 미열거)',
    '2026-07-07T10:00:00+09:00',
    '2026-07-21T18:00:00+09:00',
    '속초시청소년수련관',
    '강원특별자치도 속초시 관광로363번길 14',
    38.192896,
    128.538146,
    '수강료 안내 없음(개인 태블릿·노트북 지참)',
    null,
    '속초시시설관리공단 청소년수련관',
    '033-630-6282, 033-630-6286',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11203&bmode=view',
    'https://form.naver.com/response/vjRvpdYdzSZD4P6cM7IcAQ',
    null,
    '속초시시설관리공단',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11203&bmode=view',
    'pending',
    false,
    false,
    '2026-07-21T15:00:00+09:00',
    null,
    'https://place.map.kakao.com/1232522750',
    '2026-07-21T15:00:00+09:00',
    'occurrences'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '2026-summer-neulbom-baking',
    '2026 여름방학 늘봄학교: 달콤베이킹',
    '초등 1~6학년 10명이 쿠키와 머핀 등을 만드는 8회 베이킹 과정입니다.',
    '재료비는 1회 6,000원이며 8회 모두 참여하면 48,000원입니다. 수강 시작 뒤에는 재료비 환불이 어렵습니다. 모집 정원의 70% 미만이면 폐강될 수 있으며 운영 일정은 사정에 따라 바뀔 수 있습니다.',
    'education',
    array['child'],
    '2026-07-27T10:00:00+09:00',
    '2026-08-05T11:30:00+09:00',
    '7월 27일~8월 5일 10:00~11:30, 총 8회(공식 안내에 개별 회차 날짜는 미열거)',
    '2026-07-07T10:00:00+09:00',
    '2026-07-21T18:00:00+09:00',
    '속초시청소년수련관',
    '강원특별자치도 속초시 관광로363번길 14',
    38.192896,
    128.538146,
    '재료비 1회 6,000원(8회 모두 참여 시 48,000원)',
    false,
    '속초시시설관리공단 청소년수련관',
    '033-630-6282, 033-630-6286',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11203&bmode=view',
    'https://form.naver.com/response/I3KLB53zAGLLyYzIEwB2Pg',
    null,
    '속초시시설관리공단',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11203&bmode=view',
    'pending',
    false,
    false,
    '2026-07-21T15:00:00+09:00',
    null,
    'https://place.map.kakao.com/1232522750',
    '2026-07-21T15:00:00+09:00',
    'occurrences'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '2026-short-form-60-seconds-story',
    '숏폼 공모전 「60초로 찍는 나의 이야기」',
    '속초·양양·고성 초중고 학생이 개인 또는 팀으로 참여하는 세로형 숏폼 영상 공모전입니다.',
    '학교, 여름, 일상, 책 등 자유 주제로 30초~1분 30초 분량의 세로형 9:16 MP4 영상을 제출합니다. 파일은 500MB 이하, 해상도는 720p 이상이어야 합니다. 신청서와 영상을 이메일(pcs333888@korea.kr) 또는 이음톡의 속초교육문화관 문헌정보과 박창수에게 제출합니다. 결과 발표는 8월 14일이며 초·중·고 부문별 최우수 1팀, 우수 3팀, 장려 5팀을 선정합니다.',
    'other',
    array['child', 'youth'],
    '2026-07-09T00:00:00+09:00',
    '2026-08-06T23:59:59+09:00',
    '접수 기간 전체(공식 안내에 일일 운영시간 없음)',
    '2026-07-09T00:00:00+09:00',
    '2026-08-06T23:59:59+09:00',
    '온라인 제출(이메일·이음톡)',
    null,
    null,
    null,
    '참가비 별도 안내 없음',
    null,
    '속초교육문화관',
    '033-630-0219',
    'https://lib.gwe.go.kr/sokecc/menu/3738/board/273/post/34277',
    null,
    'https://lib.gwe.go.kr/uploads/editor/thumb/ee03f3f20ef94321b92c02ebda94d175.jpg',
    '속초교육문화관',
    'https://lib.gwe.go.kr/sokecc/menu/3738/board/273/post/34277',
    'pending',
    false,
    false,
    '2026-07-21T15:00:00+09:00',
    null,
    null,
    null,
    'continuous'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '2026-july-reading-quiz-book-knows',
    '청소년·성인 독서퀴즈 「책은 답을 알고 있다」 7월',
    '전자도서관에서 「그 여름의 왈츠」를 읽고 온라인 퀴즈에 참여하는 청소년·성인 독서 행사입니다.',
    '강원특별자치도교육청 전자도서관에서 7월 도서 「그 여름의 왈츠」를 대출해 읽은 뒤 Google Forms 퀴즈를 제출합니다. 정답자 중 6명을 추첨해 모바일 상품권을 증정하며 당첨자는 7월 31일 14:00에 발표합니다.',
    'education',
    array['youth', 'adult'],
    '2026-07-07T00:00:00+09:00',
    '2026-07-29T23:59:59+09:00',
    '응모 기간 전체(온라인)',
    '2026-07-07T00:00:00+09:00',
    '2026-07-29T23:59:59+09:00',
    '온라인 참여(전자도서관·Google Forms)',
    null,
    null,
    null,
    '참가비 별도 안내 없음(전자도서 대출 필요)',
    null,
    '속초교육문화관',
    '033-630-0204(기관 대표)',
    'https://lib.gwe.go.kr/sokecc/menu/4817/board/273/post/34460',
    'https://forms.gle/r1ZM8bCv2HGzVs4i7',
    null,
    '속초교육문화관',
    'https://lib.gwe.go.kr/sokecc/menu/4817/board/273/post/34460',
    'pending',
    false,
    false,
    '2026-07-21T15:00:00+09:00',
    null,
    null,
    null,
    'continuous'
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '2026-daepo-love',
    '2026 대포야 사랑해',
    '대포항 친수호안 수변무대에서 토요일 저녁마다 열리는 6회 야외 공연입니다.',
    '7월 4·11·18·25일과 8월 8·15일에 마술, 광대, 밴드, 댄스, 국악관현악, 재즈 등 공연을 선보입니다. 공식 안내에는 8월 1일 공연이 없고, 예매·사전신청 절차와 관람 요금도 적혀 있지 않습니다.',
    'performance',
    array['all'],
    '2026-07-04T19:30:00+09:00',
    '2026-08-15T21:00:00+09:00',
    '7월 4·11·18·25일, 8월 8·15일 19:30~21:00(총 6회)',
    null,
    null,
    '대포항 친수호안 수변무대',
    '강원특별자치도 속초시 대포항 일원',
    null,
    null,
    '관람 요금·사전신청 안내 없음(현장 관람형 야외공연)',
    null,
    '속초시·(사)한국예총 속초지회',
    null,
    'https://www.sokcho.go.kr/ct/tour/tour_guide/news?articleSeq=817450',
    null,
    'https://www.sokcho.go.kr/upload/image_attach/2026/07/%EC%B9%B4%EB%93%9C%EB%89%B4%EC%8A%A4%203.jpg',
    '속초관광',
    'https://www.sokcho.go.kr/ct/tour/tour_guide/news?articleSeq=817450',
    'pending',
    false,
    false,
    '2026-07-21T15:00:00+09:00',
    null,
    null,
    null,
    'occurrences'
  ),
  (
    '40000000-0000-4000-8000-000000000006',
    '2026-cheongcho-water-playground',
    '2026 청초호유원지 물놀이터',
    '영유아·초등학생이 이용하는 무료 물놀이터로, 월요일과 우천 시에는 운영하지 않습니다.',
    '메인 물놀이터는 24개월~초등학생이 이용하며 5세 이하는 보호자가 동반해야 합니다. 45분 운영 후 15분 휴식합니다. 이동식 풀장은 초등학생이면서 키 1m 이상인 어린이가 이용하며 동시 이용은 약 20명, 1인 최대 이용시간은 2시간입니다. 우천 등 기상 상황에 따라 당일 운영이 취소될 수 있습니다.',
    'experience',
    array['child', 'family'],
    '2026-06-20T10:30:00+09:00',
    '2026-08-30T17:15:00+09:00',
    '화~일 10:30~17:15, 월요일 휴장·우천 시 미운영(이동식 풀장 10:30~17:00)',
    null,
    null,
    '청초호유원지 물놀이터',
    '강원특별자치도 속초시 엑스포로 140',
    null,
    null,
    '무료',
    true,
    '속초시',
    null,
    'https://blog.naver.com/sokcho_n1/224317289226',
    null,
    null,
    '속초시 공식 블로그',
    'https://blog.naver.com/sokcho_n1/224317289226',
    'pending',
    false,
    false,
    '2026-07-21T15:00:00+09:00',
    null,
    null,
    null,
    'occurrences'
  ),
  (
    '40000000-0000-4000-8000-000000000007',
    '2026-silent-dj-party',
    '2026 속초해수욕장 무소음 DJ 파티',
    '무선 헤드폰으로 음악을 즐기는 속초해수욕장 야간 무소음 DJ 파티입니다.',
    '속초해수욕장 남문 일원에서 8월 3일과 4일 이틀간 열립니다. 초기 보도에는 8월 3~5일로 소개됐지만 7월 20일자 속초시 최신 공식 보도자료는 8월 3~4일로 안내합니다. 공식 최신 공지에는 시작·종료 시각, 참가비, 사전신청 방식이 아직 공개되지 않았습니다.',
    'festival',
    array['all'],
    '2026-08-03T00:00:00+09:00',
    '2026-08-04T23:59:59+09:00',
    '8월 3~4일, 시간 미공개(2026-07-20 공식 보도자료 기준)',
    null,
    null,
    '속초해수욕장 남문 일원',
    '강원특별자치도 속초시 조양동 1464-3 일원',
    null,
    null,
    '참가비 미공개',
    null,
    '속초시',
    null,
    'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817640',
    null,
    null,
    '속초시 보도자료',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817640',
    'pending',
    false,
    false,
    '2026-07-21T15:00:00+09:00',
    null,
    null,
    null,
    'occurrences'
  ),
  (
    '40000000-0000-4000-8000-000000000008',
    '2026-sea-of-light-summer',
    '빛의 바다, Sokcho 여름 야간 확대 운영',
    '속초해수욕장 남쪽 백사장의 대형 미디어아트 시설을 야간개장 기간 매일 두 차례 운영합니다.',
    '70m×15m 규모의 미디어아트 시설에서 속초의 자연과 빛을 주제로 한 약 40분 콘텐츠를 상영합니다. 평상시 여름 운영은 매주 금·토요일이지만, 속초해수욕장 야간개장 기간인 7월 21일~8월 12일에는 매일 21:00와 22:00에 운영합니다.',
    'exhibition',
    array['all'],
    '2026-07-21T21:00:00+09:00',
    '2026-08-12T22:40:00+09:00',
    '7월 21일~8월 12일 매일 21:00·22:00, 회당 약 40분',
    null,
    null,
    '속초해수욕장 「빛의 바다, Sokcho」',
    '강원특별자치도 속초시 조양동 1464-3 일원',
    38.187056,
    128.606174,
    '무료',
    true,
    '속초시',
    '033-639-2544',
    'https://www.sokcho.go.kr/ct/tour/attraction?contentSeq=168',
    null,
    'https://www.sokcho.go.kr/upload/board/TSZZZZ01/36634760-816b-4b73-9f14-07c0a53ec3da.jpg',
    '속초관광',
    'https://www.sokcho.go.kr/ct/tour/attraction?contentSeq=168',
    'pending',
    false,
    false,
    '2026-07-21T15:00:00+09:00',
    null,
    'https://www.sokcho.go.kr/ct/tour/attraction?contentSeq=168',
    '2026-07-21T15:00:00+09:00',
    'occurrences'
  ),
  (
    '40000000-0000-4000-8000-000000000009',
    '2026-lighthouse-beach-marine-sports',
    '2026 등대해수욕장 무료 해양레포츠 교육',
    '등대해수욕장에서 스노클링·스쿠버다이빙·윈드서핑·프리다이빙·패들보드를 배우는 무료 교육입니다.',
    '1차는 6월 17일~7월 2일, 2차는 8월 23일~9월 18일입니다. 스쿠버다이빙·윈드서핑·프리다이빙은 만 15~65세, 스노클링·패들보드는 나이 제한 없이 참여할 수 있습니다. 희망 체험일 3일 전 10:00부터 카카오톡 채널 채팅으로 예약하며, 당일 현장 접수는 13:10~15:40에 잔여 인원이 있을 때 가능합니다. 강풍·우천 등 기상 상황에 따라 취소되거나 대체 프로그램으로 바뀔 수 있습니다.',
    'education',
    array['all'],
    '2026-06-17T13:00:00+09:00',
    '2026-09-18T17:00:00+09:00',
    '1차 6월 17일~7월 2일, 2차 8월 23일~9월 18일 13:00~17:00(세부 체험 가능일은 카카오 예약창 확인)',
    null,
    null,
    '등대해수욕장',
    '강원특별자치도 속초시 영랑동 147-266번지 일원',
    38.217342,
    128.594933,
    '무료',
    true,
    '속초시·속초시요트협회',
    null,
    'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=816838',
    'https://pf.kakao.com/_xfLVyK',
    'https://www.sokcho.go.kr/upload/board/BDAAFF09/8ff5dabb-fd73-4491-a220-c6944e7e4e3a.png',
    '속초시 보도자료',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=816838',
    'pending',
    false,
    false,
    '2026-07-21T15:00:00+09:00',
    null,
    'https://www.sokcho.go.kr/ct/tour/attraction?contentSeq=88',
    '2026-07-21T15:00:00+09:00',
    'occurrences'
  )
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  category = excluded.category,
  audiences = excluded.audiences,
  event_start_at = excluded.event_start_at,
  event_end_at = excluded.event_end_at,
  operating_hours = excluded.operating_hours,
  application_start_at = excluded.application_start_at,
  application_end_at = excluded.application_end_at,
  location_name = excluded.location_name,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  price_text = excluded.price_text,
  is_free = excluded.is_free,
  organizer = excluded.organizer,
  contact = excluded.contact,
  official_url = excluded.official_url,
  application_url = excluded.application_url,
  image_url = excluded.image_url,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  review_status = 'pending',
  is_featured = excluded.is_featured,
  is_demo = excluded.is_demo,
  last_verified_at = excluded.last_verified_at,
  published_at = null,
  location_source_url = excluded.location_source_url,
  location_verified_at = excluded.location_verified_at,
  schedule_mode = excluded.schedule_mode;

-- 이 파일이 관리하는 구조화 회차만 지운 뒤 최신 회차를 다시 넣는다.
delete from public.event_occurrences
where event_id in (
  select id
  from public.events
  where slug in (
    '2026-summer-neulbom-ai-paibo',
    '2026-summer-neulbom-baking',
    '2026-daepo-love',
    '2026-cheongcho-water-playground',
    '2026-silent-dj-party',
    '2026-sea-of-light-summer',
    '2026-lighthouse-beach-marine-sports'
  )
);

-- 늘봄학교: 공식 공고의 7월 27일~8월 5일·총 8회에 해당하는 평일 8일.
insert into public.event_occurrences (event_id, starts_at, ends_at)
select
  events.id,
  occurrence.starts_at,
  occurrence.ends_at
from public.events as events
cross join (
  values
    ('2026-07-27T10:00:00+09:00'::timestamptz, '2026-07-27T11:30:00+09:00'::timestamptz),
    ('2026-07-28T10:00:00+09:00'::timestamptz, '2026-07-28T11:30:00+09:00'::timestamptz),
    ('2026-07-29T10:00:00+09:00'::timestamptz, '2026-07-29T11:30:00+09:00'::timestamptz),
    ('2026-07-30T10:00:00+09:00'::timestamptz, '2026-07-30T11:30:00+09:00'::timestamptz),
    ('2026-07-31T10:00:00+09:00'::timestamptz, '2026-07-31T11:30:00+09:00'::timestamptz),
    ('2026-08-03T10:00:00+09:00'::timestamptz, '2026-08-03T11:30:00+09:00'::timestamptz),
    ('2026-08-04T10:00:00+09:00'::timestamptz, '2026-08-04T11:30:00+09:00'::timestamptz),
    ('2026-08-05T10:00:00+09:00'::timestamptz, '2026-08-05T11:30:00+09:00'::timestamptz)
) as occurrence(starts_at, ends_at)
where events.slug in ('2026-summer-neulbom-ai-paibo', '2026-summer-neulbom-baking');

-- 대포야 사랑해: 공식 카드뉴스에 표시된 6회. 8월 1일은 없다.
insert into public.event_occurrences (event_id, starts_at, ends_at)
select
  events.id,
  occurrence.starts_at,
  occurrence.ends_at
from public.events as events
cross join (
  values
    ('2026-07-04T19:30:00+09:00'::timestamptz, '2026-07-04T21:00:00+09:00'::timestamptz),
    ('2026-07-11T19:30:00+09:00'::timestamptz, '2026-07-11T21:00:00+09:00'::timestamptz),
    ('2026-07-18T19:30:00+09:00'::timestamptz, '2026-07-18T21:00:00+09:00'::timestamptz),
    ('2026-07-25T19:30:00+09:00'::timestamptz, '2026-07-25T21:00:00+09:00'::timestamptz),
    ('2026-08-08T19:30:00+09:00'::timestamptz, '2026-08-08T21:00:00+09:00'::timestamptz),
    ('2026-08-15T19:30:00+09:00'::timestamptz, '2026-08-15T21:00:00+09:00'::timestamptz)
) as occurrence(starts_at, ends_at)
where events.slug = '2026-daepo-love';

-- 청초호유원지 물놀이터: 6월 20일~8월 30일 중 월요일을 제외한 62일.
-- 우천 휴장은 사전 열거할 수 없으므로 설명과 운영시간에 별도로 표시한다.
insert into public.event_occurrences (event_id, starts_at, ends_at)
select
  events.id,
  ('2026-06-20'::date + day_offset + time '10:30') at time zone 'Asia/Seoul',
  ('2026-06-20'::date + day_offset + time '17:15') at time zone 'Asia/Seoul'
from public.events as events
cross join generate_series(0, 71) as series(day_offset)
where events.slug = '2026-cheongcho-water-playground'
  and extract(isodow from ('2026-06-20'::date + day_offset)) <> 1;

-- 무소음 DJ 파티: 최신 공식 자료에는 날짜만 있어 하루 전체 회차로 보존한다.
insert into public.event_occurrences (event_id, starts_at, ends_at)
select
  events.id,
  occurrence.starts_at,
  occurrence.ends_at
from public.events as events
cross join (
  values
    ('2026-08-03T00:00:00+09:00'::timestamptz, '2026-08-03T23:59:59+09:00'::timestamptz),
    ('2026-08-04T00:00:00+09:00'::timestamptz, '2026-08-04T23:59:59+09:00'::timestamptz)
) as occurrence(starts_at, ends_at)
where events.slug = '2026-silent-dj-party';

-- 빛의 바다 여름 확대 운영: 23일 동안 매일 21:00·22:00, 총 46회.
insert into public.event_occurrences (event_id, starts_at, ends_at)
select
  events.id,
  ('2026-07-21'::date + day_offset + show_time) at time zone 'Asia/Seoul',
  ('2026-07-21'::date + day_offset + show_time + interval '40 minutes') at time zone 'Asia/Seoul'
from public.events as events
cross join generate_series(0, 22) as series(day_offset)
cross join (values (time '21:00'), (time '22:00')) as shows(show_time)
where events.slug = '2026-sea-of-light-summer';

-- 등대해수욕장 해양레포츠: 공식 포스터가 구분한 1차·2차 운영기간.
-- 2026 공지에는 기간 안의 휴무 요일이 없어 임의로 일별 회차를 만들지 않는다.
insert into public.event_occurrences (event_id, starts_at, ends_at)
select
  events.id,
  occurrence.starts_at,
  occurrence.ends_at
from public.events as events
cross join (
  values
    ('2026-06-17T13:00:00+09:00'::timestamptz, '2026-07-02T17:00:00+09:00'::timestamptz),
    ('2026-08-23T13:00:00+09:00'::timestamptz, '2026-09-18T17:00:00+09:00'::timestamptz)
) as occurrence(starts_at, ends_at)
where events.slug = '2026-lighthouse-beach-marine-sports';

insert into public.event_sources (event_id, provider, original_url, external_id, collected_at, last_checked_at)
select
  events.id,
  source.provider,
  source.original_url,
  source.external_id,
  '2026-07-21T15:00:00+09:00'::timestamptz,
  '2026-07-21T15:00:00+09:00'::timestamptz
from public.events as events
join (
  values
    ('2026-summer-neulbom-ai-paibo', '속초시시설관리공단', 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11203&bmode=view', '11203'),
    ('2026-summer-neulbom-baking', '속초시시설관리공단', 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11203&bmode=view', '11203'),
    ('2026-short-form-60-seconds-story', '속초교육문화관', 'https://lib.gwe.go.kr/sokecc/menu/3738/board/273/post/34277', '34277'),
    ('2026-july-reading-quiz-book-knows', '속초교육문화관', 'https://lib.gwe.go.kr/sokecc/menu/4817/board/273/post/34460', '34460'),
    ('2026-daepo-love', '속초관광', 'https://www.sokcho.go.kr/ct/tour/tour_guide/news?articleSeq=817450', '817450'),
    ('2026-cheongcho-water-playground', '속초시 공식 블로그', 'https://blog.naver.com/sokcho_n1/224317289226', '224317289226'),
    ('2026-cheongcho-water-playground', '웰로 공식글 미러', 'https://www.welfarehello.com/community/hometownNews/2026-%EC%B2%AD%EC%B4%88%ED%98%B8%EC%9C%A0%EC%9B%90%EC%A7%80-%EB%AC%BC%EB%86%80%EC%9D%B4%ED%84%B0-%EA%B0%9C%EC%9E%A5--875fb2f2-433f-4ea4-91c2-929155a6d727', '875fb2f2-433f-4ea4-91c2-929155a6d727'),
    ('2026-silent-dj-party', '속초시 보도자료', 'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817640', '817640'),
    ('2026-sea-of-light-summer', '속초관광', 'https://www.sokcho.go.kr/ct/tour/attraction?contentSeq=168', '168'),
    ('2026-sea-of-light-summer', '속초시 보도자료', 'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817640', '817640'),
    ('2026-lighthouse-beach-marine-sports', '속초시 보도자료', 'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=816838', '816838'),
    ('2026-lighthouse-beach-marine-sports', '속초시요트협회 카카오톡 채널', 'https://pf.kakao.com/_xfLVyK/113507829', '113507829')
) as source(slug, provider, original_url, external_id)
  on source.slug = events.slug
on conflict (event_id, provider, original_url) do update set
  external_id = excluded.external_id,
  last_checked_at = excluded.last_checked_at;

-- 9개 검토 후보가 모두 pending으로 저장됐는지 검사한다.
do $event_check$
declare
  matched_count integer;
begin
  select count(*)
  into matched_count
  from public.events
  where slug in (
    '2026-summer-neulbom-ai-paibo',
    '2026-summer-neulbom-baking',
    '2026-short-form-60-seconds-story',
    '2026-july-reading-quiz-book-knows',
    '2026-daepo-love',
    '2026-cheongcho-water-playground',
    '2026-silent-dj-party',
    '2026-sea-of-light-summer',
    '2026-lighthouse-beach-marine-sports'
  )
    and review_status = 'pending'
    and is_demo = false;

  if matched_count <> 9 then
    raise exception '검토 후보 저장 불일치: expected 9, matched %', matched_count;
  end if;
end
$event_check$;

-- 구조화 회차가 행사별 예상 개수와 일치하는지 검사한다.
do $occurrence_check$
declare
  matched_event_count integer;
begin
  select count(*)
  into matched_event_count
  from (
    values
      ('2026-summer-neulbom-ai-paibo', 8),
      ('2026-summer-neulbom-baking', 8),
      ('2026-daepo-love', 6),
      ('2026-cheongcho-water-playground', 62),
      ('2026-silent-dj-party', 2),
      ('2026-sea-of-light-summer', 46),
      ('2026-lighthouse-beach-marine-sports', 2)
  ) as expected(slug, occurrence_count)
  join public.events as events
    on events.slug = expected.slug
  join lateral (
    select count(*)::integer as occurrence_count
    from public.event_occurrences
    where event_id = events.id
  ) as actual
    on actual.occurrence_count = expected.occurrence_count;

  if matched_event_count <> 7 then
    raise exception '구조화 회차 저장 불일치: expected 7 matched events, matched %', matched_event_count;
  end if;
end
$occurrence_check$;

commit;

-- SQL Editor 결과에서 9행의 핵심 검토값을 바로 확인한다.
select
  title,
  event_start_at,
  event_end_at,
  application_start_at,
  application_end_at,
  price_text,
  is_free,
  schedule_mode,
  review_status,
  source_url,
  application_url
from public.events
where slug in (
  '2026-summer-neulbom-ai-paibo',
  '2026-summer-neulbom-baking',
  '2026-short-form-60-seconds-story',
  '2026-july-reading-quiz-book-knows',
  '2026-daepo-love',
  '2026-cheongcho-water-playground',
  '2026-silent-dj-party',
  '2026-sea-of-light-summer',
  '2026-lighthouse-beach-marine-sports'
)
order by event_start_at, title;
