-- 2026-07-19 운영 감사에서 공식 행사 원문과 카카오 POI를 교차 확인한 단일 장소만 반영한다.
-- `속초해수욕장 일원`과 다중 장소 원데이캠프는 임의 대표 좌표를 만들지 않는다.

begin;

with verified_locations (
  id,
  latitude,
  longitude,
  location_source_url,
  corrected_address
) as (
  values
    ('0147d5ce-6787-4a35-892f-da7f12b9fe47'::uuid, 38.212623::numeric, 128.588542::numeric, 'https://place.map.kakao.com/10543534', null::text),
    ('f223e289-7049-4610-b57a-2ce938e36546'::uuid, 38.212623::numeric, 128.588542::numeric, 'https://place.map.kakao.com/10543534', null::text),
    ('cec66cdf-bea1-4a7b-8c53-bbea0ff4e418'::uuid, 38.200572::numeric, 128.539408::numeric, 'https://place.map.kakao.com/9158247', null::text),
    ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, 38.200572::numeric, 128.539408::numeric, 'https://place.map.kakao.com/9158247', null::text),
    ('b5114b96-a5c8-48a2-8d7b-fcfb25f2e731'::uuid, 38.226638::numeric, 128.588002::numeric, 'https://place.map.kakao.com/1115473252', null::text),
    ('c3d22d81-5d1d-45ec-9f55-74b5dbd25778'::uuid, 38.190649::numeric, 128.584503::numeric, 'https://place.map.kakao.com/841405953', null::text),
    ('4d7d584f-aa46-4c58-948b-c544df46388a'::uuid, 38.190649::numeric, 128.584503::numeric, 'https://place.map.kakao.com/841405953', null::text),
    ('480ef65e-e2c3-4043-9da4-74df1322ed64'::uuid, 38.190649::numeric, 128.584503::numeric, 'https://place.map.kakao.com/841405953', null::text),
    ('51ebfdd5-bc5c-4b5d-b602-91618d1b2554'::uuid, 38.196667::numeric, 128.576566::numeric, 'https://place.map.kakao.com/463660174', null::text),
    ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, 38.176031::numeric, 128.596420::numeric, 'https://place.map.kakao.com/2030312267', '강원특별자치도 속초시 농공단지1길 4'),
    ('397bd6b3-b2bc-485a-9b04-657db6a33b98'::uuid, 38.186778::numeric, 128.590864::numeric, 'https://place.map.kakao.com/27110028', null::text),
    ('7409a9d8-6b68-4622-9c6b-e17672a8c2a9'::uuid, 38.186778::numeric, 128.590864::numeric, 'https://place.map.kakao.com/27110028', null::text),
    ('dec25963-3f6c-4929-b6a6-433e31553e6f'::uuid, 38.207710::numeric, 128.592084::numeric, 'https://place.map.kakao.com/17248991', null::text),
    ('7d933329-f570-4d4f-ad46-20f91c2da619'::uuid, 37.511824::numeric, 127.059159::numeric, 'https://place.map.kakao.com/17573702', null::text),
    ('dbc8f68a-16ba-48cd-9db0-50af10ead557'::uuid, 38.192883::numeric, 128.534749::numeric, 'https://place.map.kakao.com/10565967', null::text),
    ('16744cc4-2950-418f-a166-776b44a01362'::uuid, 38.192896::numeric, 128.538146::numeric, 'https://place.map.kakao.com/1232522750', '강원특별자치도 속초시 관광로363번길 14'),
    ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, 38.201990::numeric, 128.570494::numeric, 'https://place.map.kakao.com/478263281', '강원특별자치도 속초시 만리공원길 34'),
    ('729b8b08-e935-40c7-a605-e158e875a322'::uuid, 38.259382::numeric, 128.558417::numeric, 'https://place.map.kakao.com/816544655', null::text)
)
update public.events as events
set
  latitude = verified_locations.latitude,
  longitude = verified_locations.longitude,
  address = coalesce(verified_locations.corrected_address, events.address),
  location_source_url = verified_locations.location_source_url,
  location_verified_at = '2026-07-19T22:18:08+09:00'::timestamptz
from verified_locations
where events.id = verified_locations.id;

-- 감사표의 18개가 모두 존재하고 정확한 값으로 반영됐는지 확인한다.
-- 하나라도 누락되거나 값이 다르면 예외로 migration 전체를 롤백한다.
do $$
declare
  present_location_count integer;
  matched_location_count integer;
begin
  select count(*)
  into present_location_count
  from public.events
  where id = any (array[
    '0147d5ce-6787-4a35-892f-da7f12b9fe47'::uuid,
    'f223e289-7049-4610-b57a-2ce938e36546'::uuid,
    'cec66cdf-bea1-4a7b-8c53-bbea0ff4e418'::uuid,
    '94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid,
    'b5114b96-a5c8-48a2-8d7b-fcfb25f2e731'::uuid,
    'c3d22d81-5d1d-45ec-9f55-74b5dbd25778'::uuid,
    '4d7d584f-aa46-4c58-948b-c544df46388a'::uuid,
    '480ef65e-e2c3-4043-9da4-74df1322ed64'::uuid,
    '51ebfdd5-bc5c-4b5d-b602-91618d1b2554'::uuid,
    '0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid,
    '397bd6b3-b2bc-485a-9b04-657db6a33b98'::uuid,
    '7409a9d8-6b68-4622-9c6b-e17672a8c2a9'::uuid,
    'dec25963-3f6c-4929-b6a6-433e31553e6f'::uuid,
    '7d933329-f570-4d4f-ad46-20f91c2da619'::uuid,
    'dbc8f68a-16ba-48cd-9db0-50af10ead557'::uuid,
    '16744cc4-2950-418f-a166-776b44a01362'::uuid,
    '51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid,
    '729b8b08-e935-40c7-a605-e158e875a322'::uuid
  ]);

  select count(*)
  into matched_location_count
  from (
    values
      ('0147d5ce-6787-4a35-892f-da7f12b9fe47'::uuid, 38.212623::numeric, 128.588542::numeric, 'https://place.map.kakao.com/10543534'::text, null::text),
      ('f223e289-7049-4610-b57a-2ce938e36546'::uuid, 38.212623::numeric, 128.588542::numeric, 'https://place.map.kakao.com/10543534'::text, null::text),
      ('cec66cdf-bea1-4a7b-8c53-bbea0ff4e418'::uuid, 38.200572::numeric, 128.539408::numeric, 'https://place.map.kakao.com/9158247'::text, null::text),
      ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, 38.200572::numeric, 128.539408::numeric, 'https://place.map.kakao.com/9158247'::text, null::text),
      ('b5114b96-a5c8-48a2-8d7b-fcfb25f2e731'::uuid, 38.226638::numeric, 128.588002::numeric, 'https://place.map.kakao.com/1115473252'::text, null::text),
      ('c3d22d81-5d1d-45ec-9f55-74b5dbd25778'::uuid, 38.190649::numeric, 128.584503::numeric, 'https://place.map.kakao.com/841405953'::text, null::text),
      ('4d7d584f-aa46-4c58-948b-c544df46388a'::uuid, 38.190649::numeric, 128.584503::numeric, 'https://place.map.kakao.com/841405953'::text, null::text),
      ('480ef65e-e2c3-4043-9da4-74df1322ed64'::uuid, 38.190649::numeric, 128.584503::numeric, 'https://place.map.kakao.com/841405953'::text, null::text),
      ('51ebfdd5-bc5c-4b5d-b602-91618d1b2554'::uuid, 38.196667::numeric, 128.576566::numeric, 'https://place.map.kakao.com/463660174'::text, null::text),
      ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, 38.176031::numeric, 128.596420::numeric, 'https://place.map.kakao.com/2030312267'::text, '강원특별자치도 속초시 농공단지1길 4'::text),
      ('397bd6b3-b2bc-485a-9b04-657db6a33b98'::uuid, 38.186778::numeric, 128.590864::numeric, 'https://place.map.kakao.com/27110028'::text, null::text),
      ('7409a9d8-6b68-4622-9c6b-e17672a8c2a9'::uuid, 38.186778::numeric, 128.590864::numeric, 'https://place.map.kakao.com/27110028'::text, null::text),
      ('dec25963-3f6c-4929-b6a6-433e31553e6f'::uuid, 38.207710::numeric, 128.592084::numeric, 'https://place.map.kakao.com/17248991'::text, null::text),
      ('7d933329-f570-4d4f-ad46-20f91c2da619'::uuid, 37.511824::numeric, 127.059159::numeric, 'https://place.map.kakao.com/17573702'::text, null::text),
      ('dbc8f68a-16ba-48cd-9db0-50af10ead557'::uuid, 38.192883::numeric, 128.534749::numeric, 'https://place.map.kakao.com/10565967'::text, null::text),
      ('16744cc4-2950-418f-a166-776b44a01362'::uuid, 38.192896::numeric, 128.538146::numeric, 'https://place.map.kakao.com/1232522750'::text, '강원특별자치도 속초시 관광로363번길 14'::text),
      ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, 38.201990::numeric, 128.570494::numeric, 'https://place.map.kakao.com/478263281'::text, '강원특별자치도 속초시 만리공원길 34'::text),
      ('729b8b08-e935-40c7-a605-e158e875a322'::uuid, 38.259382::numeric, 128.558417::numeric, 'https://place.map.kakao.com/816544655'::text, null::text)
  ) as expected(id, latitude, longitude, location_source_url, corrected_address)
  join public.events as events
    on events.id = expected.id
    and events.latitude = expected.latitude
    and events.longitude = expected.longitude
    and events.location_source_url = expected.location_source_url
    and events.location_verified_at = '2026-07-19T22:18:08+09:00'::timestamptz
    and (expected.corrected_address is null or events.address = expected.corrected_address);

  if present_location_count <> 0 and matched_location_count <> 18 then
    raise exception '검증 위치 backfill 불일치: expected 18, matched %', matched_location_count;
  end if;
end
$$;

-- 가장 중요했던 무비 나잇 원문을 정확한 상세 URL로 멱등 보정한다.
update public.events
set
  source_url = 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view',
  official_url = 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view',
  last_verified_at = '2026-07-19T22:18:08+09:00'::timestamptz
where id = '729b8b08-e935-40c7-a605-e158e875a322'::uuid;

insert into public.event_sources (
  event_id,
  provider,
  original_url,
  external_id,
  collected_at,
  last_checked_at
)
select
  id,
  '속초시시설관리공단',
  'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view',
  '11208',
  '2026-07-19T22:18:08+09:00'::timestamptz,
  '2026-07-19T22:18:08+09:00'::timestamptz
from public.events
where id = '729b8b08-e935-40c7-a605-e158e875a322'::uuid
on conflict (event_id, provider, original_url) do update
set
  external_id = excluded.external_id,
  last_checked_at = excluded.last_checked_at;

-- 무비 나잇 행사와 감사한 원문 이력이 각각 정확히 한 건이어야 한다.
do $$
declare
  movie_event_count integer;
  movie_source_count integer;
begin
  select count(*) into movie_event_count
  from public.events
  where id = '729b8b08-e935-40c7-a605-e158e875a322'::uuid;

  select count(*) into movie_source_count
  from public.event_sources
  where
    event_id = '729b8b08-e935-40c7-a605-e158e875a322'::uuid
    and provider = '속초시시설관리공단'
    and original_url = 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view';

  if movie_event_count <> 0
    and (movie_event_count <> 1 or movie_source_count <> 1)
  then
    raise exception '무비 나잇 단건 검증 실패: events %, sources %', movie_event_count, movie_source_count;
  end if;
end
$$;

-- 2026-07-19 감사표에 고정된 실제 운영 행사 20건만 확인 완료로 갱신한다.
-- 이후 새로 수집된 행은 이 migration으로 검증 완료 처리하지 않는다.
with audited_events (id, source_url) as (
  values
    ('a41ee093-4b9e-4ee4-a8d8-058fd8ef50e4'::uuid, 'https://www.mcst.go.kr/site/s_culture/festival/festivalView.jsp?pRo=12&pSeq=13468'::text),
    ('0147d5ce-6787-4a35-892f-da7f12b9fe47'::uuid, 'https://sokcho.go.kr/sc/event/program?eventSeq=669'::text),
    ('f223e289-7049-4610-b57a-2ce938e36546'::uuid, 'https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260710160553.jpg'::text),
    ('cec66cdf-bea1-4a7b-8c53-bbea0ff4e418'::uuid, 'https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817624'::text),
    ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, 'https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817365'::text),
    ('b5114b96-a5c8-48a2-8d7b-fcfb25f2e731'::uuid, 'https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260715160313.jpg'::text),
    ('c3d22d81-5d1d-45ec-9f55-74b5dbd25778'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294'::text),
    ('4d7d584f-aa46-4c58-948b-c544df46388a'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294'::text),
    ('480ef65e-e2c3-4043-9da4-74df1322ed64'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294'::text),
    ('51ebfdd5-bc5c-4b5d-b602-91618d1b2554'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817464'::text),
    ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817391'::text),
    ('397bd6b3-b2bc-485a-9b04-657db6a33b98'::uuid, 'https://library.sokcho.go.kr/sokcho/menu/259/board/51/post/1079'::text),
    ('7409a9d8-6b68-4622-9c6b-e17672a8c2a9'::uuid, 'https://library.sokcho.go.kr/sokcho/menu/258/movie/82'::text),
    ('dec25963-3f6c-4929-b6a6-433e31553e6f'::uuid, 'https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260710120524.jpg'::text),
    ('7d933329-f570-4d4f-ad46-20f91c2da619'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11250&bmode=view'::text),
    ('dbc8f68a-16ba-48cd-9db0-50af10ead557'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11248&bmode=view'::text),
    ('e1b6f7e8-478c-44e8-8560-7a1623d1a43d'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11247&bmode=view'::text),
    ('16744cc4-2950-418f-a166-776b44a01362'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11246&bmode=view'::text),
    ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11212&bmode=view'::text),
    ('729b8b08-e935-40c7-a605-e158e875a322'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view'::text)
)
update public.events as events
set last_verified_at = '2026-07-19T22:18:08+09:00'::timestamptz
from audited_events
where
  events.id = audited_events.id
  and events.source_url = audited_events.source_url;

with audited_events (id, source_url) as (
  values
    ('a41ee093-4b9e-4ee4-a8d8-058fd8ef50e4'::uuid, 'https://www.mcst.go.kr/site/s_culture/festival/festivalView.jsp?pRo=12&pSeq=13468'::text),
    ('0147d5ce-6787-4a35-892f-da7f12b9fe47'::uuid, 'https://sokcho.go.kr/sc/event/program?eventSeq=669'::text),
    ('f223e289-7049-4610-b57a-2ce938e36546'::uuid, 'https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260710160553.jpg'::text),
    ('cec66cdf-bea1-4a7b-8c53-bbea0ff4e418'::uuid, 'https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817624'::text),
    ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, 'https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817365'::text),
    ('b5114b96-a5c8-48a2-8d7b-fcfb25f2e731'::uuid, 'https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260715160313.jpg'::text),
    ('c3d22d81-5d1d-45ec-9f55-74b5dbd25778'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294'::text),
    ('4d7d584f-aa46-4c58-948b-c544df46388a'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294'::text),
    ('480ef65e-e2c3-4043-9da4-74df1322ed64'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294'::text),
    ('51ebfdd5-bc5c-4b5d-b602-91618d1b2554'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817464'::text),
    ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, 'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817391'::text),
    ('397bd6b3-b2bc-485a-9b04-657db6a33b98'::uuid, 'https://library.sokcho.go.kr/sokcho/menu/259/board/51/post/1079'::text),
    ('7409a9d8-6b68-4622-9c6b-e17672a8c2a9'::uuid, 'https://library.sokcho.go.kr/sokcho/menu/258/movie/82'::text),
    ('dec25963-3f6c-4929-b6a6-433e31553e6f'::uuid, 'https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260710120524.jpg'::text),
    ('7d933329-f570-4d4f-ad46-20f91c2da619'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11250&bmode=view'::text),
    ('dbc8f68a-16ba-48cd-9db0-50af10ead557'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11248&bmode=view'::text),
    ('e1b6f7e8-478c-44e8-8560-7a1623d1a43d'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11247&bmode=view'::text),
    ('16744cc4-2950-418f-a166-776b44a01362'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11246&bmode=view'::text),
    ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11212&bmode=view'::text),
    ('729b8b08-e935-40c7-a605-e158e875a322'::uuid, 'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view'::text)
)
update public.event_sources as sources
set last_checked_at = '2026-07-19T22:18:08+09:00'::timestamptz
from audited_events
where
  sources.event_id = audited_events.id
  and sources.original_url = audited_events.source_url;

-- 행사와 현재 노출 원문 이력이 감사표 20건과 정확히 일치하는지 검증한다.
do $$
declare
  audited_ids uuid[] := array[
    'a41ee093-4b9e-4ee4-a8d8-058fd8ef50e4'::uuid,
    '0147d5ce-6787-4a35-892f-da7f12b9fe47'::uuid,
    'f223e289-7049-4610-b57a-2ce938e36546'::uuid,
    'cec66cdf-bea1-4a7b-8c53-bbea0ff4e418'::uuid,
    '94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid,
    'b5114b96-a5c8-48a2-8d7b-fcfb25f2e731'::uuid,
    'c3d22d81-5d1d-45ec-9f55-74b5dbd25778'::uuid,
    '4d7d584f-aa46-4c58-948b-c544df46388a'::uuid,
    '480ef65e-e2c3-4043-9da4-74df1322ed64'::uuid,
    '51ebfdd5-bc5c-4b5d-b602-91618d1b2554'::uuid,
    '0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid,
    '397bd6b3-b2bc-485a-9b04-657db6a33b98'::uuid,
    '7409a9d8-6b68-4622-9c6b-e17672a8c2a9'::uuid,
    'dec25963-3f6c-4929-b6a6-433e31553e6f'::uuid,
    '7d933329-f570-4d4f-ad46-20f91c2da619'::uuid,
    'dbc8f68a-16ba-48cd-9db0-50af10ead557'::uuid,
    'e1b6f7e8-478c-44e8-8560-7a1623d1a43d'::uuid,
    '16744cc4-2950-418f-a166-776b44a01362'::uuid,
    '51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid,
    '729b8b08-e935-40c7-a605-e158e875a322'::uuid
  ];
  audited_urls text[] := array[
    'https://www.mcst.go.kr/site/s_culture/festival/festivalView.jsp?pRo=12&pSeq=13468',
    'https://sokcho.go.kr/sc/event/program?eventSeq=669',
    'https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260710160553.jpg',
    'https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817624',
    'https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817365',
    'https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260715160313.jpg',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817464',
    'https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817391',
    'https://library.sokcho.go.kr/sokcho/menu/259/board/51/post/1079',
    'https://library.sokcho.go.kr/sokcho/menu/258/movie/82',
    'https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260710120524.jpg',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11250&bmode=view',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11248&bmode=view',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11247&bmode=view',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11246&bmode=view',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11212&bmode=view',
    'https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view'
  ];
  verified_event_count integer;
  verified_source_count integer;
  present_event_count integer;
begin
  if cardinality(audited_ids) <> 20 or cardinality(audited_urls) <> 20 then
    raise exception '운영 감사 상수 불일치: ids %, urls %', cardinality(audited_ids), cardinality(audited_urls);
  end if;

  select count(*) into present_event_count
  from public.events
  where id = any (audited_ids);

  select count(*) into verified_event_count
  from unnest(audited_ids, audited_urls) as audited(id, source_url)
  join public.events as events
    on events.id = audited.id
    and events.source_url = audited.source_url
    and events.last_verified_at = '2026-07-19T22:18:08+09:00'::timestamptz;

  select count(*) into verified_source_count
  from unnest(audited_ids, audited_urls) as audited(id, source_url)
  join public.event_sources as sources
    on sources.event_id = audited.id
    and sources.original_url = audited.source_url
    and sources.last_checked_at = '2026-07-19T22:18:08+09:00'::timestamptz;

  if present_event_count <> 0
    and (verified_event_count <> 20 or verified_source_count <> 20)
  then
    raise exception '운영 감사 20건 검증 실패: events %, sources %', verified_event_count, verified_source_count;
  end if;
end
$$;

commit;
