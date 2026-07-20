-- 모든 행사는 UI 검증용 샘플입니다. 실제 운영 행사로 게시하지 마세요.
-- now() 상대값을 사용하므로 seed를 적용할 때마다 진행/신청 상태 사례를 재현할 수 있습니다.
-- event_sources의 충돌 키는 migration의 (event_id, provider, original_url) 계약과 동일합니다.

insert into public.places
  (id, slug, name, category, summary, address, latitude, longitude, official_url, is_published)
values
  ('20000000-0000-4000-8000-000000000001', 'sokcho-beach', '속초해수욕장', '해변', '속초 도심과 가까운 대표 해변입니다.', '강원특별자치도 속초시 해오름로 190', 38.190700, 128.601500, 'https://www.sokcho.go.kr/ct/', true),
  ('20000000-0000-4000-8000-000000000002', 'abai-village', '아바이마을', '마을', '실향민 문화와 지역 이야기를 만날 수 있는 마을입니다.', '강원특별자치도 속초시 아바이마을길 22', 38.202800, 128.591800, 'https://www.sokcho.go.kr/ct/tour/tour_guide/commentator', true),
  ('20000000-0000-4000-8000-000000000003', 'yeongrang-lake', '영랑호', '호수', '산책과 호수 풍경을 함께 즐기기 좋은 곳입니다.', '강원특별자치도 속초시 금호동 600-11', 38.222700, 128.574700, 'https://www.sokcho.go.kr/ct/tour/tour_guide/commentator', true),
  ('20000000-0000-4000-8000-000000000004', 'sokcho-museum', '속초시립박물관', '박물관', '속초의 역사와 생활문화를 살펴볼 수 있는 시립박물관입니다.', '강원특별자치도 속초시 신흥2길 16', 38.240600, 128.566300, 'https://www.sokcho.go.kr/ct/tour/tour_guide/commentator', true),
  ('20000000-0000-4000-8000-000000000005', 'cheongcho-lake-park', '청초호수공원', '공원', '청초호 주변을 걷고 쉬어가기 좋은 도심 공원입니다.', '강원특별자치도 속초시 엑스포로 140', 38.199900, 128.585900, 'https://www.sokcho.go.kr/ct/', true),
  ('20000000-0000-4000-8000-000000000006', 'yeonggeumjeong', '영금정', '전망', '동명항 인근에서 동해 풍경을 바라볼 수 있는 명소입니다.', '강원특별자치도 속초시 영금정로 43', 38.212400, 128.599400, 'https://www.sokcho.go.kr/ct/', true),
  ('20000000-0000-4000-8000-000000000007', 'national-mountain-museum', '국립산악박물관', '박물관', '산악 문화와 역사를 주제로 한 국립 박물관입니다.', '강원특별자치도 속초시 미시령로 3054', 38.204700, 128.517800, 'https://nmm.forest.go.kr/', true),
  ('20000000-0000-4000-8000-000000000008', 'oeyongchi-bada-hyanggiro', '외옹치 바다향기로', '산책로', '바다를 가까이에서 바라보며 걷는 해안 산책로입니다.', '강원특별자치도 속초시 대포동 666', 38.177600, 128.606600, 'https://www.sokcho.go.kr/ct/tour/tour_guide/commentator', true),
  ('20000000-0000-4000-8000-000000000009', 'daepo-port', '대포항', '항구', '속초 남쪽의 바다와 항구 풍경을 만날 수 있는 곳입니다.', '강원특별자치도 속초시 대포항1길 6-13', 38.170600, 128.605300, 'https://www.sokcho.go.kr/ct/', true),
  ('20000000-0000-4000-8000-000000000010', 'seoraksan-sogongwon', '설악산 소공원', '자연', '설악산 탐방을 시작하는 대표적인 거점입니다.', '강원특별자치도 속초시 설악산로 1091', 38.173000, 128.488000, 'https://www.knps.or.kr/seorak', true)
on conflict (slug) do nothing;

insert into public.events
  (id, slug, title, summary, description, category, audiences, event_start_at, event_end_at,
   operating_hours, application_start_at, application_end_at, location_name, address, latitude,
   longitude, price_text, is_free, organizer, contact, official_url, application_url, image_url,
   source_name, source_url, review_status, is_featured, is_demo, last_verified_at, published_at)
values
  ('10000000-0000-4000-8000-000000000001', 'demo-sea-family-festival', '[샘플] 바다빛 가족 문화축제', '현재 진행 중·무료·가족·축제 상태를 검증하는 샘플입니다.', '실제 행사가 아닌 UI 검증용 샘플입니다.', 'festival', array['family','child'], now() - interval '3 hours', now() + interval '8 hours', '샘플 운영 시간 10:00–20:00', null, null, '속초해수욕장 인근(샘플)', '강원특별자치도 속초시 해오름로 190', 38.190700, 128.601500, '무료(샘플)', true, '속초모아 데모', null, null, null, null, '속초모아 샘플 데이터', 'https://www.sokcho.go.kr/', 'published', true, true, now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'demo-children-craft', '[샘플] 어린이 바다 공예 체험', '신청 가능·아동·가족·체험 상태를 검증하는 샘플입니다.', '실제 행사가 아닌 UI 검증용 샘플입니다.', 'experience', array['child','family'], now() + interval '3 days', now() + interval '3 days 3 hours', '샘플 운영 시간 14:00–17:00', now() - interval '3 days', now() + interval '2 days', '속초시립박물관 인근(샘플)', '강원특별자치도 속초시 신흥2길 16', 38.240600, 128.566300, '무료(샘플)', true, '속초모아 데모', null, null, null, null, '속초모아 샘플 데이터', 'https://www.sokcho.go.kr/', 'published', false, true, now(), now()),
  ('10000000-0000-4000-8000-000000000003', 'demo-youth-media-class', '[샘플] 청소년 미디어 창작 교실', '신청 마감 임박·청소년·교육 상태를 검증하는 샘플입니다.', '실제 행사가 아닌 UI 검증용 샘플입니다.', 'education', array['youth'], now() + interval '6 days', now() + interval '20 days', '샘플 일정: 토요일 13:00–16:00', now() - interval '7 days', now() + interval '6 hours', '속초시 청소년 시설(샘플)', null, 38.205100, 128.577800, '무료(샘플)', true, '속초모아 데모', null, null, null, null, '속초모아 샘플 데이터', 'https://www.sokcho.go.kr/', 'published', true, true, now(), now()),
  ('10000000-0000-4000-8000-000000000004', 'demo-sunset-concert', '[샘플] 청초호 노을 음악회', '유료·공연·신청 가능 상태를 검증하는 샘플입니다.', '실제 행사가 아닌 UI 검증용 샘플입니다.', 'performance', array['all'], now() + interval '5 days', now() + interval '5 days 2 hours', '샘플 공연 시간 19:00–21:00', now() - interval '10 days', now() + interval '4 days', '청초호수공원 인근(샘플)', '강원특별자치도 속초시 엑스포로 140', 38.199900, 128.585900, '10,000원(샘플)', false, '속초모아 데모', null, null, null, null, '속초모아 샘플 데이터', 'https://www.sokcho.go.kr/', 'published', false, true, now(), now()),
  ('10000000-0000-4000-8000-000000000005', 'demo-mountain-exhibition', '[샘플] 산과 사람 기획전', '이번 달·진행 중·전시 상태를 검증하는 샘플입니다.', '실제 행사가 아닌 UI 검증용 샘플입니다.', 'exhibition', array['all'], now() - interval '5 days', now() + interval '15 days', '운영 시간은 원문 확인 필요', null, null, '국립산악박물관 인근(샘플)', '강원특별자치도 속초시 미시령로 3054', 38.204700, 128.517800, '무료(샘플)', true, '속초모아 데모', null, null, null, null, '속초모아 샘플 데이터', 'https://www.sokcho.go.kr/', 'published', false, true, now(), now()),
  ('10000000-0000-4000-8000-000000000006', 'demo-abai-walk', '[샘플] 아바이마을 이야기 산책', '가족·체험·유료 상태를 검증하는 샘플입니다.', '실제 행사가 아닌 UI 검증용 샘플입니다.', 'experience', array['family','adult'], now() + interval '1 day', now() + interval '1 day 2 hours', '샘플 운영 시간 11:00–13:00', now() - interval '4 days', now() + interval '12 hours', '아바이마을(샘플)', '강원특별자치도 속초시 아바이마을길 22', 38.202800, 128.591800, '5,000원(샘플)', false, '속초모아 데모', null, null, null, null, '속초모아 샘플 데이터', 'https://www.sokcho.go.kr/', 'published', false, true, now(), now()),
  ('10000000-0000-4000-8000-000000000007', 'demo-library-reading', '[샘플] 가족 그림책 낭독회', '이번 주·가족·교육 상태를 검증하는 샘플입니다.', '실제 행사가 아닌 UI 검증용 샘플입니다.', 'education', array['child','family'], now() + interval '2 days', now() + interval '2 days 90 minutes', '샘플 운영 시간 10:30–12:00', now() - interval '2 days', now() + interval '1 day', '속초시 공공도서관(샘플)', null, 38.207000, 128.579000, '무료(샘플)', true, '속초모아 데모', null, null, null, null, '속초모아 샘플 데이터', 'https://www.sokcho.go.kr/', 'published', false, true, now(), now()),
  ('10000000-0000-4000-8000-000000000008', 'demo-ended-winter-program', '[샘플] 지난 계절 문화 프로그램', '종료·신청 마감 상세 유지 상태를 검증하는 샘플입니다.', '실제 행사가 아닌 UI 검증용 샘플입니다.', 'other', array['all'], now() - interval '25 days', now() - interval '20 days', null, now() - interval '40 days', now() - interval '30 days', '속초시 일원(샘플)', null, 38.207000, 128.591000, '무료(샘플)', true, '속초모아 데모', null, null, null, null, '속초모아 샘플 데이터', 'https://www.sokcho.go.kr/', 'published', false, true, now(), now())
on conflict (slug) do nothing;

update public.events
set schedule_mode = 'occurrences'
where slug = 'demo-youth-media-class';

insert into public.event_occurrences (event_id, starts_at, ends_at)
select id, now() + interval '6 days', now() + interval '6 days 3 hours'
from public.events where slug = 'demo-youth-media-class'
union all
select id, now() + interval '13 days', now() + interval '13 days 3 hours'
from public.events where slug = 'demo-youth-media-class'
on conflict (event_id, starts_at) do update set ends_at = excluded.ends_at;

insert into public.event_sources (event_id, provider, original_url, last_checked_at)
select id, 'sokcho-moa-demo', source_url, now()
from public.events
where is_demo = true
on conflict (event_id, provider, original_url) do nothing;
