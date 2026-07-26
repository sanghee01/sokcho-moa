-- 2026-07-24 속초 행사 주간 수집 검토 후보 9건.
--
-- 실행 위치: Supabase SQL Editor
-- 공개 여부: 새 행은 모두 pending이며, 이 파일은 어떤 행사도 published로 바꾸지 않는다.
-- 멱등성: 같은 slug의 pending/rejected 행은 최신 검증 내용으로 갱신한다.
-- 안전장치: 같은 slug가 이미 published이면 전체 트랜잭션을 중단한다.
--
-- 현재 관리자 폼 계약에 맞춰 행사 안내 URL은 source_url에 저장한다.
-- legacy official_url은 새로 쓰거나 갱신하지 않는다.
-- 공식 원문에 없는 시간·요금·신청 마감은 추측하지 않았다.

begin;

do $review_guard$
begin
  if exists (
    select 1
    from public.events
    where slug in (
      '2026-seorak-busking-summer-night-walk',
      '2026-sokcho-museum-night-opening',
      '2026-kids-concert-klang',
      '2026-sokcho-family-center-korean-education',
      '2026-sokcho-family-center-kiip-0',
      '2026-sokcho-family-center-kiip-1',
      '2026-sokcho-library-beginner-photoshop',
      '2026-sokcho-library-calligraphy',
      '2026-sokcho-library-photoshop-practical'
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
    '50000000-0000-4000-8000-000000000001',
    '2026-seorak-busking-summer-night-walk',
    '속초 버스킹 여행-여름 밤 산책편',
    '설악동 C지구 소공원에서 어쿠스틱 공연과 마술쇼를 즐기는 이틀간의 야간 버스킹입니다.',
    '시민과 관광객 누구나 관람할 수 있습니다. 공연장 인근 설악향기로 산책과 함께 즐길 수 있으며, 현장에서 속초시 공식 Instagram·Facebook 등 SNS를 팔로우한 관광객에게 소정의 기념품을 주는 이벤트도 진행합니다. 공식 원문에는 사전신청 절차와 관람 요금이 적혀 있지 않습니다.',
    'performance',
    array['all'],
    '2026-07-24T19:30:00+09:00',
    '2026-07-25T21:00:00+09:00',
    '7월 24·25일 19:30~21:00',
    null,
    null,
    '설악동 C지구 소공원',
    null,
    null,
    null,
    '관람 요금·사전신청 안내 없음',
    null,
    '속초시',
    null,
    null,
    null,
    '속초시 보도자료',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817783',
    'pending',
    false,
    false,
    '2026-07-24T22:00:00+09:00',
    null,
    null,
    null,
    'occurrences'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '2026-sokcho-museum-night-opening',
    '2026 속초시립박물관 야간개장 & 고향의 밤 콘서트',
    '여름밤 금·토요일마다 박물관 전시를 무료 관람하고 토요일에는 전통문화 공연도 즐기는 프로그램입니다.',
    '야간개장 시간에는 여름방학 특별기획전 「우리들의 작은 친구, 곤충」도 함께 관람할 수 있습니다. 고향의 밤 콘서트는 토요일 19:30부터 야외무대에서 열립니다. 7월 25일과 8월 15일에는 화정무정·이동안류춤보존회·장금도춤보존회가 출연하고, 8월 1일과 8일에는 속초시립풍물단과 속초사자놀이보존회 공연이 이어집니다.',
    'performance',
    array['all'],
    '2026-07-24T18:00:00+09:00',
    '2026-08-15T21:00:00+09:00',
    '7월 24일~8월 15일 매주 금·토 18:00~21:00, 토요일 콘서트 19:30~',
    null,
    null,
    '속초시립박물관',
    '강원특별자치도 속초시 신흥2길 16',
    38.226638,
    128.588002,
    '야간 입장 및 고향의 밤 콘서트 무료',
    true,
    '속초시립박물관',
    '033-639-2978',
    null,
    null,
    '속초시립박물관',
    'https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817794',
    'pending',
    false,
    false,
    '2026-07-24T22:00:00+09:00',
    null,
    'https://place.map.kakao.com/1115473252',
    '2026-07-24T22:00:00+09:00',
    'occurrences'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '2026-kids-concert-klang',
    '클래식 앙상블 클랑과 함께하는 「키즈콘서트」',
    '클래식 앙상블 클랑이 전 연령 관객을 위해 여는 무료 키즈 콘서트입니다.',
    '2026 속초문화예술지원사업으로 진행되는 대관 공연입니다. 공식 안내에는 오후 4시 시작만 적혀 있고 종료 시각은 공개되지 않았습니다. 예매와 공연 문의는 공식 포스터의 전화번호로 받습니다.',
    'performance',
    array['all'],
    '2026-08-15T16:00:00+09:00',
    null,
    '8월 15일 16:00, 종료 시각 미공개',
    null,
    null,
    '속초문화예술회관 대공연장',
    '강원특별자치도 속초시 번영로 155',
    38.212623,
    128.588542,
    '전석 무료',
    true,
    '클래식 앙상블 클랑',
    '010-7294-4844',
    null,
    null,
    '속초시 행사포털',
    'https://www.sokcho.go.kr/sc/event/program?eventSeq=710',
    'pending',
    false,
    false,
    '2026-07-24T22:00:00+09:00',
    null,
    'https://place.map.kakao.com/10543534',
    '2026-07-24T22:00:00+09:00',
    'occurrences'
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '2026-sokcho-family-center-korean-education',
    '2026 하반기 속초시 가족센터 한국어 교육',
    '속초시 거주 결혼이민자와 중도입국자녀를 위한 수준별 맞춤 한국어 교육입니다.',
    '매주 화요일과 목요일 오전에 진행됩니다. 정확한 수업 시각과 접수 마감일은 공식 보도자료에 공개되지 않았습니다. 참여 희망자는 7월 27일부터 속초시 가족센터 홈페이지에서 신청합니다.',
    'education',
    array['youth', 'adult'],
    '2026-08-18T00:00:00+09:00',
    '2026-12-10T23:59:59+09:00',
    '8월 18일~12월 10일 매주 화·목 오전, 정확한 시각 미공개',
    '2026-07-27T00:00:00+09:00',
    null,
    '속초시 가족센터',
    '강원특별자치도 속초시 청초호반로 201 근로자종합복지관 3층',
    null,
    null,
    '무료',
    true,
    '속초시 가족센터',
    '033-637-2680',
    'https://sokcho.familynet.or.kr/center/lay1/program/S295T322C451/recruitReceipt/list.do',
    null,
    '속초시 보도자료',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817754',
    'pending',
    false,
    false,
    '2026-07-24T22:00:00+09:00',
    null,
    null,
    null,
    'continuous'
  ),
  (
    '50000000-0000-4000-8000-000000000005',
    '2026-sokcho-family-center-kiip-0',
    '2026 하반기 속초시 가족센터 사회통합프로그램(KIIP) 0단계',
    '합법 체류 외국인을 대상으로 운영하는 사회통합프로그램 한국어 기초과정입니다.',
    '법무부 공식 교육과정으로, 이수 시 귀화·영주 자격 취득과 체류자격 변경·연장 심사 등에서 혜택을 받을 수 있습니다. 정확한 일일 수업 시각과 접수 마감일은 공식 보도자료에 공개되지 않았습니다. 신청은 7월 27일부터 사회통합정보망에서 받습니다.',
    'education',
    array['adult'],
    '2026-08-10T00:00:00+09:00',
    '2026-08-14T23:59:59+09:00',
    '8월 10~14일, 정확한 시각 미공개',
    '2026-07-27T00:00:00+09:00',
    null,
    '속초시 가족센터',
    '강원특별자치도 속초시 청초호반로 201 근로자종합복지관 3층',
    null,
    null,
    '교육비 100,000원, 출석률 100% 달성 시 50% 감면',
    false,
    '속초시 가족센터·법무부',
    '033-637-2680',
    'https://www.socinet.go.kr/',
    null,
    '속초시 보도자료',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817754',
    'pending',
    false,
    false,
    '2026-07-24T22:00:00+09:00',
    null,
    null,
    null,
    'continuous'
  ),
  (
    '50000000-0000-4000-8000-000000000006',
    '2026-sokcho-family-center-kiip-1',
    '2026 하반기 속초시 가족센터 사회통합프로그램(KIIP) 1단계',
    '합법 체류 외국인을 대상으로 운영하는 사회통합프로그램 한국어 초급과정입니다.',
    '법무부 공식 교육과정으로, 이수 시 귀화·영주 자격 취득과 체류자격 변경·연장 심사 등에서 혜택을 받을 수 있습니다. 정확한 수업 시각·개별 수업일과 접수 마감일은 공식 보도자료에 공개되지 않았습니다. 신청은 7월 27일부터 사회통합정보망에서 받습니다.',
    'education',
    array['adult'],
    '2026-08-18T00:00:00+09:00',
    '2026-12-10T23:59:59+09:00',
    '8월 18일~12월 10일, 정확한 시각·개별 수업일 미공개',
    '2026-07-27T00:00:00+09:00',
    null,
    '속초시 가족센터',
    '강원특별자치도 속초시 청초호반로 201 근로자종합복지관 3층',
    null,
    null,
    '교육비 100,000원, 출석률 100% 달성 시 50% 감면',
    false,
    '속초시 가족센터·법무부',
    '033-637-2680',
    'https://www.socinet.go.kr/',
    null,
    '속초시 보도자료',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817754',
    'pending',
    false,
    false,
    '2026-07-24T22:00:00+09:00',
    null,
    null,
    null,
    'continuous'
  ),
  (
    '50000000-0000-4000-8000-000000000007',
    '2026-sokcho-library-beginner-photoshop',
    '2026년 초보탈출 포토샵',
    '초등 4~6학년 15명을 선착순 모집하는 속초교육도서관 포토샵 강좌입니다.',
    '대기자는 5명까지 받습니다. 공식 신청 목록에는 전체 운영 시작·종료와 시간만 표시되고 개별 수업일, 수강료·재료비, 세부 강의실은 공개되지 않았습니다. 게시 전에 신청 상세 화면이나 도서관 문의로 해당 값을 확인해야 합니다.',
    'education',
    array['child'],
    '2026-08-22T09:00:00+09:00',
    '2026-11-28T11:00:00+09:00',
    '8월 22일 09:00~11월 28일 11:00, 개별 수업일 미표시',
    '2026-07-21T10:00:00+09:00',
    '2026-08-04T17:00:00+09:00',
    '속초교육도서관',
    '강원특별자치도 속초시 번영로 15',
    null,
    null,
    '수강료·재료비 안내 확인 필요',
    null,
    '속초교육도서관',
    '033-636-1495',
    'https://lib.gwe.go.kr/sclib/menu/3904/lecture-event/9204',
    null,
    '속초교육도서관',
    'https://lib.gwe.go.kr/sclib/menu/3904/lecture-event/9204',
    'pending',
    false,
    false,
    '2026-07-24T22:00:00+09:00',
    null,
    null,
    null,
    'continuous'
  ),
  (
    '50000000-0000-4000-8000-000000000008',
    '2026-sokcho-library-calligraphy',
    '2026년 나만의 디자인, 캘리그라피',
    '학부모와 지역주민 15명을 선착순 모집하는 속초교육도서관 캘리그라피 강좌입니다.',
    '대기자는 5명까지 받습니다. 공식 신청 목록에는 전체 운영 시작·종료와 시간만 표시되고 개별 수업일, 수강료·재료비, 세부 강의실은 공개되지 않았습니다. 게시 전에 신청 상세 화면이나 도서관 문의로 해당 값을 확인해야 합니다.',
    'education',
    array['adult'],
    '2026-08-20T10:00:00+09:00',
    '2026-11-19T12:00:00+09:00',
    '8월 20일 10:00~11월 19일 12:00, 개별 수업일 미표시',
    '2026-07-21T10:00:00+09:00',
    '2026-08-04T17:00:00+09:00',
    '속초교육도서관',
    '강원특별자치도 속초시 번영로 15',
    null,
    null,
    '수강료·재료비 안내 확인 필요',
    null,
    '속초교육도서관',
    '033-636-1495',
    'https://lib.gwe.go.kr/sclib/menu/3904/lecture-event/9203',
    null,
    '속초교육도서관',
    'https://lib.gwe.go.kr/sclib/menu/3904/lecture-event/9203',
    'pending',
    false,
    false,
    '2026-07-24T22:00:00+09:00',
    null,
    null,
    null,
    'continuous'
  ),
  (
    '50000000-0000-4000-8000-000000000009',
    '2026-sokcho-library-photoshop-practical',
    '2026년 포토샵 실무활용',
    '학부모와 지역주민 15명을 선착순 모집하는 속초교육도서관 포토샵 실무 강좌입니다.',
    '대기자는 5명까지 받습니다. 공식 신청 목록에는 전체 운영 시작·종료와 시간만 표시되고 개별 수업일, 수강료·재료비, 세부 강의실은 공개되지 않았습니다. 게시 전에 신청 상세 화면이나 도서관 문의로 해당 값을 확인해야 합니다.',
    'education',
    array['adult'],
    '2026-08-20T10:00:00+09:00',
    '2026-11-12T12:00:00+09:00',
    '8월 20일 10:00~11월 12일 12:00, 개별 수업일 미표시',
    '2026-07-21T10:00:00+09:00',
    '2026-08-04T17:00:00+09:00',
    '속초교육도서관',
    '강원특별자치도 속초시 번영로 15',
    null,
    null,
    '수강료·재료비 안내 확인 필요',
    null,
    '속초교육도서관',
    '033-636-1495',
    'https://lib.gwe.go.kr/sclib/menu/3904/lecture-event/9202',
    null,
    '속초교육도서관',
    'https://lib.gwe.go.kr/sclib/menu/3904/lecture-event/9202',
    'pending',
    false,
    false,
    '2026-07-24T22:00:00+09:00',
    null,
    null,
    null,
    'continuous'
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

delete from public.event_occurrences
where event_id in (
  select id
  from public.events
  where slug in (
    '2026-seorak-busking-summer-night-walk',
    '2026-sokcho-museum-night-opening',
    '2026-kids-concert-klang',
    '2026-sokcho-family-center-korean-education',
    '2026-sokcho-family-center-kiip-0',
    '2026-sokcho-family-center-kiip-1',
    '2026-sokcho-library-beginner-photoshop',
    '2026-sokcho-library-calligraphy',
    '2026-sokcho-library-photoshop-practical'
  )
);

insert into public.event_occurrences (event_id, starts_at, ends_at)
select event.id, occurrence.starts_at, occurrence.ends_at
from (
  values
    ('2026-seorak-busking-summer-night-walk', '2026-07-24T19:30:00+09:00'::timestamptz, '2026-07-24T21:00:00+09:00'::timestamptz),
    ('2026-seorak-busking-summer-night-walk', '2026-07-25T19:30:00+09:00'::timestamptz, '2026-07-25T21:00:00+09:00'::timestamptz),
    ('2026-sokcho-museum-night-opening', '2026-07-24T18:00:00+09:00'::timestamptz, '2026-07-24T21:00:00+09:00'::timestamptz),
    ('2026-sokcho-museum-night-opening', '2026-07-25T18:00:00+09:00'::timestamptz, '2026-07-25T21:00:00+09:00'::timestamptz),
    ('2026-sokcho-museum-night-opening', '2026-07-31T18:00:00+09:00'::timestamptz, '2026-07-31T21:00:00+09:00'::timestamptz),
    ('2026-sokcho-museum-night-opening', '2026-08-01T18:00:00+09:00'::timestamptz, '2026-08-01T21:00:00+09:00'::timestamptz),
    ('2026-sokcho-museum-night-opening', '2026-08-07T18:00:00+09:00'::timestamptz, '2026-08-07T21:00:00+09:00'::timestamptz),
    ('2026-sokcho-museum-night-opening', '2026-08-08T18:00:00+09:00'::timestamptz, '2026-08-08T21:00:00+09:00'::timestamptz),
    ('2026-sokcho-museum-night-opening', '2026-08-14T18:00:00+09:00'::timestamptz, '2026-08-14T21:00:00+09:00'::timestamptz),
    ('2026-sokcho-museum-night-opening', '2026-08-15T18:00:00+09:00'::timestamptz, '2026-08-15T21:00:00+09:00'::timestamptz),
    ('2026-kids-concert-klang', '2026-08-15T16:00:00+09:00'::timestamptz, null::timestamptz)
) as occurrence(slug, starts_at, ends_at)
join public.events as event on event.slug = occurrence.slug;

insert into public.event_sources (
  event_id,
  provider,
  original_url,
  external_id,
  collected_at,
  last_checked_at
)
select
  event.id,
  source.provider,
  source.original_url,
  source.external_id,
  '2026-07-24T22:00:00+09:00',
  '2026-07-24T22:00:00+09:00'
from (
  values
    ('2026-seorak-busking-summer-night-walk', '속초시 보도자료', 'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817783', '817783'),
    ('2026-sokcho-museum-night-opening', '속초시립박물관', 'https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817794', '817794'),
    ('2026-kids-concert-klang', '속초시 행사포털', 'https://www.sokcho.go.kr/sc/event/program?eventSeq=710', '710'),
    ('2026-sokcho-family-center-korean-education', '속초시 보도자료', 'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817754', '817754'),
    ('2026-sokcho-family-center-kiip-0', '속초시 보도자료', 'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817754', '817754'),
    ('2026-sokcho-family-center-kiip-1', '속초시 보도자료', 'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817754', '817754'),
    ('2026-sokcho-library-beginner-photoshop', '속초교육도서관', 'https://lib.gwe.go.kr/sclib/menu/3904/lecture-event/9204', '9204'),
    ('2026-sokcho-library-calligraphy', '속초교육도서관', 'https://lib.gwe.go.kr/sclib/menu/3904/lecture-event/9203', '9203'),
    ('2026-sokcho-library-photoshop-practical', '속초교육도서관', 'https://lib.gwe.go.kr/sclib/menu/3904/lecture-event/9202', '9202')
) as source(slug, provider, original_url, external_id)
join public.events as event on event.slug = source.slug
on conflict (event_id, provider, original_url) do update set
  external_id = excluded.external_id,
  last_checked_at = excluded.last_checked_at;

do $review_verify$
declare
  candidate_count integer;
  source_count integer;
  busking_occurrence_count integer;
  museum_occurrence_count integer;
  concert_occurrence_count integer;
begin
  select count(*)
  into candidate_count
  from public.events
  where slug in (
    '2026-seorak-busking-summer-night-walk',
    '2026-sokcho-museum-night-opening',
    '2026-kids-concert-klang',
    '2026-sokcho-family-center-korean-education',
    '2026-sokcho-family-center-kiip-0',
    '2026-sokcho-family-center-kiip-1',
    '2026-sokcho-library-beginner-photoshop',
    '2026-sokcho-library-calligraphy',
    '2026-sokcho-library-photoshop-practical'
  )
    and review_status = 'pending'
    and is_demo = false;

  if candidate_count <> 9 then
    raise exception '검토 SQL 검증 실패: pending 후보 9건 예상, 실제 %건', candidate_count;
  end if;

  select count(*)
  into source_count
  from public.event_sources as source
  join public.events as event on event.id = source.event_id
  where event.slug in (
    '2026-seorak-busking-summer-night-walk',
    '2026-sokcho-museum-night-opening',
    '2026-kids-concert-klang',
    '2026-sokcho-family-center-korean-education',
    '2026-sokcho-family-center-kiip-0',
    '2026-sokcho-family-center-kiip-1',
    '2026-sokcho-library-beginner-photoshop',
    '2026-sokcho-library-calligraphy',
    '2026-sokcho-library-photoshop-practical'
  )
    and source.original_url = event.source_url;

  if source_count <> 9 then
    raise exception '검토 SQL 검증 실패: 현재 출처 9건 예상, 실제 %건', source_count;
  end if;

  select count(*)
  into busking_occurrence_count
  from public.event_occurrences as occurrence
  join public.events as event on event.id = occurrence.event_id
  where event.slug = '2026-seorak-busking-summer-night-walk';

  select count(*)
  into museum_occurrence_count
  from public.event_occurrences as occurrence
  join public.events as event on event.id = occurrence.event_id
  where event.slug = '2026-sokcho-museum-night-opening';

  select count(*)
  into concert_occurrence_count
  from public.event_occurrences as occurrence
  join public.events as event on event.id = occurrence.event_id
  where event.slug = '2026-kids-concert-klang';

  if busking_occurrence_count <> 2 or museum_occurrence_count <> 8 or concert_occurrence_count <> 1 then
    raise exception
      '검토 SQL 검증 실패: 회차 수 예상 2/8/1, 실제 %/%/%',
      busking_occurrence_count,
      museum_occurrence_count,
      concert_occurrence_count;
  end if;
end
$review_verify$;

commit;

select
  title,
  event_start_at,
  event_end_at,
  application_start_at,
  application_end_at,
  schedule_mode,
  review_status,
  source_url
from public.events
where slug in (
  '2026-seorak-busking-summer-night-walk',
  '2026-sokcho-museum-night-opening',
  '2026-kids-concert-klang',
  '2026-sokcho-family-center-korean-education',
  '2026-sokcho-family-center-kiip-0',
  '2026-sokcho-family-center-kiip-1',
  '2026-sokcho-library-beginner-photoshop',
  '2026-sokcho-library-calligraphy',
  '2026-sokcho-library-photoshop-practical'
)
order by event_start_at, title;
