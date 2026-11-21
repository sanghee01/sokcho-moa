-- 장소 데이터 보강(2026-11-21 사용자 요청). 구조는 바꾸지 않고 값만 넣는다.
-- 1. 명소의 "자세히 보기" 주소가 공용 목록 페이지·관광지도 PDF를 가리키던 것을 그 장소의 페이지로 바꾼다.
-- 2. 즐길거리 목록·상세(/places)에 보일 장소의 분류·운영시간·요금 등을 채우고, 명소에 없던 곳을 새로 넣는다.
-- 원본은 data/attractions.json과 data/activity-places.json이다.
-- 운영에서 관리자가 이미 고친 값은 덮어쓰지 않는다: 주소는 예전 값 그대로일 때만, 즐길거리 값은 분류가 비어 있을 때만 바꾼다.

-- 1. 공식 링크 교체
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_05/view.do?cntno=47' where slug = 'goseong-attraction-073' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=61' where slug = 'goseong-attraction-064' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=108c6689-fb7c-4144-a0f0-f84476e949f5' where slug = 'goseong-attraction-086' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_09/view.do?cntno=100' where slug = 'goseong-attraction-088' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_0101/view.do?cntno=13' where slug = 'goseong-attraction-070' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=64' where slug = 'goseong-attraction-063' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=66' where slug = 'goseong-attraction-056' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://hwaamsa.com/' where slug = 'goseong-attraction-081' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_05/view.do?cntno=50' where slug = 'goseong-attraction-078' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=c7c8ce83-d3b6-41f0-a401-1d0d16f3eb77' where slug = 'goseong-attraction-085' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_09/view.do?cntno=101' where slug = 'goseong-attraction-089' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_0108/view.do?cntno=22' where slug = 'goseong-attraction-091' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=71' where slug = 'goseong-attraction-057' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=72' where slug = 'goseong-attraction-065' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=73' where slug = 'goseong-attraction-058' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub03_03/view.do?cntno=128' where slug = 'goseong-attraction-080' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=74' where slug = 'goseong-attraction-061' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=76' where slug = 'goseong-attraction-053' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://sampobeach.co.kr/' where slug = 'goseong-attraction-060' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://hwaamsa.com/pages/s2_10.php' where slug = 'goseong-attraction-082' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_0107/view.do?cntno=20' where slug = 'goseong-attraction-067' and official_url is not distinct from 'https://note.gwgs.go.kr/board/notice/view.php?ntt_id=B000000077565Dy5fK2s&page=1';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub03_06/view.do?cntno=112' where slug = 'goseong-attraction-090' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_05/view.do?cntno=136' where slug = 'goseong-attraction-093' and official_url is not distinct from 'https://note.gwgs.go.kr/board/notice/view.php?ntt_id=B000000077565Dy5fK2s&page=1';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_05/view.do?cntno=49' where slug = 'goseong-attraction-079' and official_url is not distinct from 'https://note.gwgs.go.kr/board/notice/view.php?ntt_id=B000000077565Dy5fK2s&page=1';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=79' where slug = 'goseong-attraction-062' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://hwaamsa.com/pages/s2_2.php' where slug = 'goseong-attraction-083' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=80' where slug = 'goseong-attraction-055' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_05/view.do?cntno=51' where slug = 'goseong-attraction-077' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=a9c08346-b320-45e6-821b-ee2b5d638409' where slug = 'goseong-attraction-059' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_05/view.do?cntno=45' where slug = 'goseong-attraction-084' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=81' where slug = 'goseong-attraction-052' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_0104/view.do?cntno=16' where slug = 'goseong-attraction-069' and official_url is not distinct from 'https://note.gwgs.go.kr/board/notice/view.php?ntt_id=B000000077565Dy5fK2s&page=1';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=82' where slug = 'goseong-attraction-054' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_0106/view.do?cntno=19' where slug = 'goseong-attraction-071' and official_url is not distinct from 'https://note.gwgs.go.kr/board/notice/view.php?ntt_id=B000000077565Dy5fK2s&page=1';
update public.places set official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=608ea19a-281a-4840-a2e1-930d0e1f9c9f' where slug = 'goseong-attraction-075' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=ebf95a62-014a-4458-a0e0-cfd24d43bcd6' where slug = 'goseong-attraction-076' and official_url is not distinct from 'https://note.gwgs.go.kr/board/notice/view.php?ntt_id=B000000077565Dy5fK2s&page=1';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_02/view.do?cntno=85' where slug = 'goseong-attraction-066' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_05/view.do?cntno=54' where slug = 'goseong-attraction-074' and official_url is not distinct from 'https://note.gwgs.go.kr/board/notice/view.php?ntt_id=B000000077565Dy5fK2s&page=1';
update public.places set official_url = 'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_0103/view.do?cntno=15' where slug = 'goseong-attraction-068' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.dmzmuseum.com/' where slug = 'goseong-attraction-072' and official_url is not distinct from 'https://www.gangwon.to/page/gwtour2022/images/map/tourmap_17.pdf';
update public.places set official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=61' where slug = 'sokcho-attraction-021' and official_url is not distinct from 'https://www.sokcho.go.kr/ct/tour/attraction';
update public.places set official_url = 'https://www.sokcho.go.kr/ct/culture' where slug = 'sokcho-attraction-048' and official_url is not distinct from 'https://www.sokcho.go.kr/ct/tour/';
update public.places set official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=39' where slug = 'sokcho-attraction-040' and official_url is not distinct from 'https://www.sokcho.go.kr/ct/tour/attraction';
update public.places set official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=38' where slug = 'sokcho-attraction-041' and official_url is not distinct from 'https://www.sokcho.go.kr/ct/tour/attraction/culture';
update public.places set official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=93' where slug = 'sokcho-attraction-034' and official_url is not distinct from 'https://www.sokcho.go.kr/ct/tour/attraction/experience';
update public.places set official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=40' where slug = 'sokcho-attraction-039' and official_url is not distinct from 'https://www.sokcho.go.kr/ct/tour/attraction/culture';
update public.places set official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=169' where slug = 'sokcho-attraction-023' and official_url is not distinct from 'https://www.sokcho.go.kr/ct/tour/attraction/experience';
update public.places set official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=45' where slug = 'sokcho-attraction-036' and official_url is not distinct from 'https://www.sokcho.go.kr/ct/tour/attraction/culture';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yycultural.do?mode=v&seq=17' where slug = 'yangyang-attraction-110' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/todo_pictorial.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yycultural.do?mode=v&seq=114' where slug = 'yangyang-attraction-115' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yycultural.do?mode=v&seq=112' where slug = 'yangyang-attraction-099' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yycultural.do?mode=v&seq=109' where slug = 'yangyang-attraction-116' and official_url is not distinct from 'https://tour.yangyang.go.kr/';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=146' where slug = 'yangyang-attraction-102' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/todo_pictorial.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=142' where slug = 'yangyang-attraction-098' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yy10view.do?mode=v&seq=168' where slug = 'yangyang-attraction-120' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yyforest.do?mode=v&seq=155' where slug = 'yangyang-attraction-095' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=140' where slug = 'yangyang-attraction-121' and official_url is not distinct from 'https://tour.yangyang.go.kr/';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yycultural.do?mode=v&seq=104' where slug = 'yangyang-attraction-112' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/todo_pictorial.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=138' where slug = 'yangyang-attraction-106' and official_url is not distinct from 'https://tour.yangyang.go.kr/';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=136' where slug = 'yangyang-attraction-104' and official_url is not distinct from 'https://tour.yangyang.go.kr/';
update public.places set official_url = 'https://www.foresttrip.go.kr/indvz/main.do?hmpgId=0112' where slug = 'yangyang-attraction-118' and official_url is not distinct from 'https://tour.yangyang.go.kr/';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yyforest.do?mode=v&seq=158' where slug = 'yangyang-attraction-109' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/todo_pictorial.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=134' where slug = 'yangyang-attraction-101' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/todo_pictorial.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yyexperience.do?mode=v&seq=55' where slug = 'yangyang-attraction-113' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/pleasure_experience.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=145' where slug = 'yangyang-attraction-094' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yycultural.do?mode=v&seq=87' where slug = 'yangyang-attraction-122' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://www.yangyang.go.kr/gw/osm' where slug = 'yangyang-attraction-100' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yynature.do?mode=v&seq=68' where slug = 'yangyang-attraction-096' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yyforest.do?mode=v&seq=164' where slug = 'yangyang-attraction-117' and official_url is not distinct from 'https://tour.yangyang.go.kr/';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=125' where slug = 'yangyang-attraction-105' and official_url is not distinct from 'https://tour.yangyang.go.kr/';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=124' where slug = 'yangyang-attraction-107' and official_url is not distinct from 'https://tour.yangyang.go.kr/';
update public.places set official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=8290e547-2eb5-4da7-a21e-8f000358ec3d' where slug = 'yangyang-attraction-111' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/todo_pictorial.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yycultural.do?mode=v&seq=78' where slug = 'yangyang-attraction-114' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/todo_pictorial.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yycultural.do?mode=v&seq=77' where slug = 'yangyang-attraction-097' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=4e46a791-abf8-48d6-9744-b429850cce06' where slug = 'yangyang-attraction-119' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yysea.do?mode=v&seq=120' where slug = 'yangyang-attraction-103' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/yy10view.do';
update public.places set official_url = 'https://tour.yangyang.go.kr/pub/yyattraction.do?mode=v&seq=1' where slug = 'yangyang-attraction-108' and official_url is not distinct from 'https://tour.yangyang.go.kr/pub/todo_pictorial.do';

-- 2. 기존 명소에 즐길거리 값 채우기(slug도 주소에 쓰기 좋은 이름으로 바꾼다)
update public.places set
  slug = 'seorak-waterpia',
  summary = '온천수로 운영하는 한화리조트 설악의 워터파크',
  address = '강원특별자치도 속초시 미시령로2983번길 111',
  latitude = 38.207519,
  longitude = 128.528968,
  official_url = 'https://www.hanwharesort.co.kr/irsweb/resort3/tpark/tp_intro.do?tp_cd=0100',
  activity_category = 'water',
  tags = array['indoor', 'kids'],
  description = '한화리조트 설악 안에 있는 워터파크로, 실내 파도풀·유수풀과 야외 스파 시설을 함께 운영합니다. 겨울철에도 실내 시설과 스파밸리를 이용할 수 있어 아이와 함께 반나절 이상 보내기에 맞습니다. 실외 놀이시설과 노천탕은 강풍·폭우·낙뢰 때 운영이 제한될 수 있습니다.',
  hours_summary = '시즌별로 다름. 2026.10.12~2027.3.1은 주간권 10:00~17:00(입장 마감 16:30), Night Spa 18:00~20:30(입장 마감 20:00)',
  closed_summary = '연중무휴',
  price_summary = '주간권 정상요금 대인 57,000원 · 소인 49,000원(2026.10.12~12.10 기준, 12.11~2027.3.1은 62,000원 · 53,000원)',
  phone = '033-630-5800',
  parking_summary = '무료',
  cautions = '요금과 운영시간이 시즌마다 달라지므로 방문 날짜의 시즌을 공식 홈페이지에서 확인해야 합니다.
2026.10.12~2027.3.1에는 실외 파도풀·토렌트리버 등 일부 실외 시설을 운영하지 않습니다.
36개월 미만 유아는 방수 기저귀를 착용해야 하고, 놀이기구는 키와 나이 제한이 있습니다.
돗자리·유모차 반입과 반려동물 동반 입장은 할 수 없습니다.',
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/seorak-waterpia.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=116',
  image_alt = '야자수로 꾸민 설악워터피아 실내 파도풀'
where slug = 'sokcho-attraction-020' and activity_category is null;
update public.places set
  slug = 'cheoksan-oncheonjang',
  name = '척산온천장',
  summary = '옥사우나가 있는 척산온천지구의 대중 온천탕',
  address = '강원특별자치도 속초시 관광로 288',
  latitude = 38.187022,
  longitude = 128.543677,
  official_url = 'http://www.chocksanspa.co.kr/',
  activity_category = 'water',
  tags = array['indoor'],
  description = '척산온천지구에서 오래 운영해 온 온천 숙박 시설로, 숙박하지 않아도 대중 온천탕을 이용할 수 있습니다. 온탕·열탕·냉탕과 옥사우나를 갖춘 실내 온천이라 날씨와 관계없이 들르기 좋습니다. 설악산 산행이나 여행을 마치고 한두 시간 쉬어 가는 용도로 맞습니다.',
  hours_summary = '매일 06:00~20:00',
  closed_summary = '연중무휴',
  price_summary = '온천욕 개인(6세 이상) 10,000원 · 소인(6세 미만) 7,000원',
  phone = '033-636-4806',
  parking_summary = null,
  cautions = '객실과 가족온천실은 전화 예약만 받습니다.
주말 마감 시간은 안내마다 20:00과 21:00으로 달라 늦게 갈 때는 전화로 확인하는 편이 좋습니다.',
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/cheoksan-oncheonjang.webp',
  image_credit = '사진: 척산온천장 공식 홈페이지',
  image_source_url = 'http://www.chocksanspa.co.kr/',
  image_alt = '눈 덮인 척산온천장 건물 외관'
where slug = 'sokcho-attraction-019' and activity_category is null;
update public.places set
  slug = 'cheoksan-foot-spa-park',
  name = '척산족욕공원',
  summary = '척산 온천수에 발을 담그는 무료 야외 족욕장',
  address = '강원특별자치도 속초시 관광로 277',
  latitude = 38.186176,
  longitude = 128.542355,
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=73',
  activity_category = 'water',
  tags = array['free'],
  description = '속초시가 척산온천지구에 만든 야외 족욕 공원으로, 온천수에 발을 담그고 쉬어 갈 수 있습니다. 입장료가 없어 설악산이나 온천지구를 오가는 길에 20~30분 들르기에 맞습니다. 야외 시설이고 겨울(12~2월)에는 운영하지 않습니다.',
  hours_summary = '3~11월 운영. 하절기 09:00~17:30, 동절기 10:00~17:30',
  closed_summary = '12~2월 휴장, 운영 기간(3~11월)에는 쉬는 날 없음',
  price_summary = '무료(수건·방석은 유료 대여)',
  phone = '033-633-7100',
  parking_summary = null,
  cautions = '12월부터 2월까지는 문을 닫습니다.
수건과 방석은 현장에서 돈을 내고 빌려야 하므로 개인 수건을 챙기면 편합니다.
야외 시설이라 비나 강한 바람이 있는 날에는 이용이 불편합니다.',
  booking_url = null,
  operation_status = 'open',
  status_note = '12월부터 2월까지는 겨울 휴장입니다.',
  verified_on = '2026-11-21',
  image_url = '/places/cheoksan-foot-spa-park.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=73',
  image_alt = '지붕 아래 둥근 족욕탕이 있는 척산족욕공원'
where slug = 'sokcho-attraction-018' and activity_category is null;
update public.places set
  slug = 'pinodia',
  name = '피노디아',
  summary = '다빈치와 미켈란젤로를 주제로 한 두 개의 실내 뮤지엄',
  address = '강원특별자치도 속초시 엑스포로 75',
  latitude = 38.190828,
  longitude = 128.582562,
  official_url = 'https://www.pinodia.com/',
  activity_category = 'exhibition',
  tags = array['indoor', 'kids'],
  description = '청초호 옆에 있는 전시 시설로, 레오나르도 다빈치의 발명품 재현 모델을 모은 다빈치 뮤지엄과 조각 작품을 모은 미켈란젤로 뮤지엄으로 나뉩니다. 한 곳만 볼 수도 있고 통합권으로 두 곳을 함께 볼 수도 있습니다. 실내 전시라 날씨와 관계없이 관람할 수 있고, 길 건너 엑스포타워 전망대와 묶어 보기 좋습니다.',
  hours_summary = '매일 09:00~18:00, 입장 마감 17:00(7월 10일~8월 20일은 19:00까지, 입장 마감 18:00)',
  closed_summary = '연중무휴',
  price_summary = '다빈치·미켈란젤로 뮤지엄 각각 성인 15,000원 · 청소년 14,000원 · 어린이 12,000원, 두 곳 통합 성인 30,000원',
  phone = '1899-9483',
  parking_summary = '전시 관람 시 최대 3시간 무료, 이후 30분 1,000원 · 15분마다 500원',
  cautions = '퇴장한 뒤에는 다시 들어갈 수 없고 전시장 안에는 화장실이 없습니다.
음식물·유아용 웨건·장난감 반입과 반려동물 출입이 안 됩니다.
어린이(4~13세)·청소년(14~19세) 요금은 증빙 서류를 지참해야 합니다.
단체 관람은 사전 예약이 없으면 입장할 수 없습니다.',
  booking_url = 'https://booking.naver.com/booking/5/bizes/914622',
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/pinodia.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=155',
  image_alt = '다빈치가 설계한 기계 모형을 전시한 피노디아 전시실'
where slug = 'sokcho-attraction-026' and activity_category is null;
update public.places set
  slug = 'sokcho-museum',
  name = '속초시립박물관',
  summary = '속초의 역사와 실향민 문화를 보여 주는 시립 박물관',
  address = '강원특별자치도 속초시 신흥2길 16',
  latitude = 38.200540,
  longitude = 128.539536,
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=111',
  activity_category = 'exhibition',
  tags = array['indoor', 'kids'],
  description = '속초의 선사 유적과 어촌·실향민 문화를 전시하는 시립 박물관입니다. 야외에는 실향민문화촌이, 옆에는 발해역사관이 있어 한 번 입장해 함께 둘러볼 수 있고 어린이 민속체험실도 있습니다. 전시실은 실내지만 문화촌은 야외라 날씨가 좋은 날에 1~2시간 잡고 보기에 맞습니다.',
  hours_summary = '3~10월 09:00~18:00(입장 마감 17:00), 11~2월 09:00~17:00(입장 마감 16:00)',
  closed_summary = '매주 월요일, 1월 1일',
  price_summary = '일반 2,000원 · 청소년·군인 1,500원 · 어린이 700원(개인 기준)',
  phone = '033-639-2977',
  parking_summary = '무료',
  cautions = '관람 종료 1시간 전에 입장을 마감합니다.
입장권 하나로 발해역사관과 실향민문화촌까지 함께 볼 수 있습니다.',
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/sokcho-museum.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=111',
  image_alt = '하늘에서 본 속초시립박물관 실향민문화촌의 기와집과 마당'
where slug = 'sokcho-museum' and activity_category is null;
update public.places set
  slug = 'national-mountain-museum',
  name = '국립산악박물관',
  summary = '산악 역사 전시와 암벽·고산 체험을 하는 무료 국립 박물관',
  address = '강원특별자치도 속초시 미시령로 3054',
  latitude = 38.202796,
  longitude = 128.540500,
  official_url = 'https://www.komount.or.kr/nmm/',
  activity_category = 'exhibition',
  tags = array['indoor', 'kids', 'free'],
  description = '한국 등산의 역사와 산악인의 기록을 전시하는 국립 박물관으로 관람료가 없습니다. 낮은 실내 암벽과 VR 등반 체험은 예약 없이 이용하고, 저산소 환경을 겪어 보는 고산체험실은 사전 예약으로 운영합니다. 실내 시설이라 날씨와 관계없이 아이와 함께 1시간 남짓 둘러보기에 맞습니다.',
  hours_summary = '화~일요일 09:00~18:00',
  closed_summary = '매주 월요일(공휴일이면 개관), 1월 1일, 설·추석 연휴',
  price_summary = '무료',
  phone = '033-638-4459',
  parking_summary = null,
  cautions = '고산체험실(저산소 체험)은 숲나들e 온라인 사전 예약으로만 운영하며 전화 예약은 받지 않습니다.
고산체험은 10세 이상(보호자 동반)만 할 수 있고 노약자는 이용이 제한됩니다.
실내 암벽 체험은 공용 암벽화를 신으므로 개인 양말을 챙겨야 합니다.
6세 이하 어린이는 보호자와 함께 입장해야 하고 반려동물은 들어갈 수 없습니다.',
  booking_url = 'https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID07030002',
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/national-mountain-museum.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=114',
  image_alt = '천장에 거꾸로 매달린 암벽 조형물이 있는 국립산악박물관 로비'
where slug = 'national-mountain-museum' and activity_category is null;
update public.places set
  slug = 'balhae-history-hall',
  name = '발해역사관',
  summary = '발해의 역사와 문화를 전시하는 속초시립박물관의 별관',
  address = '강원특별자치도 속초시 신흥2길 16',
  latitude = 38.200842,
  longitude = 128.537251,
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=112',
  activity_category = 'exhibition',
  tags = array['indoor', 'kids'],
  description = '속초시립박물관 부지 안에 있는 전시관으로, 발해의 역사와 유물·고분 자료를 전시합니다. 발해 옷을 입어 보고 문양을 찍어 보는 체험실이 있어 초등학생과 함께 보기에 맞습니다. 박물관 입장권으로 함께 볼 수 있고 실내라 날씨 영향이 없으며 30분 안팎이면 둘러봅니다.',
  hours_summary = '3~10월 09:00~18:00, 11~2월 09:00~17:00(종료 1시간 전 매표 마감)',
  closed_summary = '매주 월요일, 1월 1일',
  price_summary = '속초시립박물관 입장료에 포함(일반 2,000원 · 청소년·군인 1,500원 · 어린이 700원)',
  phone = '033-639-2977',
  parking_summary = '무료(속초시립박물관 주차장)',
  cautions = '따로 입장권을 팔지 않고 속초시립박물관 입장권으로 함께 관람합니다.
관람 종료 1시간 전에 매표를 마감합니다.',
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/balhae-history-hall.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=112',
  image_alt = '돌벽과 유리창으로 된 발해역사관 건물 외관'
where slug = 'sokcho-attraction-029' and activity_category is null;
update public.places set
  slug = 'teddy-bear-farm',
  name = '테디베어팜',
  summary = '테마별로 꾸민 곰 인형 전시를 보는 실내 전시관',
  address = '강원특별자치도 속초시 울산바위길 3',
  latitude = 38.205225,
  longitude = 128.515665,
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=108',
  activity_category = 'exhibition',
  tags = array['indoor', 'kids'],
  description = '곰 인형을 주제별 장면으로 꾸며 놓은 개인 운영 전시관입니다. 사진 찍을 곳이 많아 어린아이와 함께 천천히 둘러보기 좋고, 관람에는 한 시간 안팎이 걸립니다. 실내 전시라 날씨 영향은 적지만 평소 금·토·일요일에만 열기 때문에 요일을 확인하고 가야 합니다.',
  hours_summary = '금~일요일 10:00~17:00(방학·연휴에는 운영 요일이 늘어남)',
  closed_summary = '매주 월~목요일(1·2월과 여름 휴가철, 공휴일에는 일부 요일 추가 운영)',
  price_summary = '성인 8,000원 · 청소년 6,000원 · 어린이(25개월~초등학생) 5,000원 · 24개월 미만 무료',
  phone = '0507-1421-3680',
  parking_summary = '건물 앞 주차장 무료',
  cautions = '평소에는 금·토·일요일에만 문을 열어 방문 요일을 확인해야 합니다.
방학과 연휴에는 운영 요일이 달라지므로 네이버 플레이스 소식이나 인스타그램 공지를 확인하는 것이 좋습니다.',
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/teddy-bear-farm.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=108',
  image_alt = '배 위에 곰 인형들을 올려 꾸민 테디베어팜 전시'
where slug = 'sokcho-attraction-030' and activity_category is null;
update public.places set
  slug = 'seokbong-ceramic-museum',
  name = '석봉도자기미술관',
  summary = '도자기 작품을 보고 물레 체험도 하는 무료 미술관',
  address = '강원특별자치도 속초시 엑스포로 156',
  latitude = 38.197882,
  longitude = 128.582597,
  official_url = 'http://www.dogong.net/',
  activity_category = 'exhibition',
  tags = array['indoor', 'kids', 'free'],
  description = '도예가 석봉 조무호의 작품과 도자기 벽화를 주제별 전시관 8곳에서 보여 주는 사립 미술관입니다. 개인 관람은 무료이고, 물레 성형·코일링·초벌 페인팅·머그컵 전사 같은 체험은 유료로 운영합니다. 엑스포공원 근처 실내 시설이라 날씨와 상관없이 들를 수 있고, 관람만 하면 30분~1시간 정도면 충분합니다.',
  hours_summary = '10:00~18:00',
  closed_summary = '매주 월요일(7월 중순~8월 중순은 휴무 없음)',
  price_summary = '개인 무료 · 단체(10인 이상) 1인 3,000원 · 도자기 체험 20,000~50,000원',
  phone = '033-638-7711',
  parking_summary = '미술관 앞 무료 공영주차장 이용',
  cautions = '도자기 체험은 안내데스크에서 신청하며 당일 현장 접수도 할 수 있습니다.
물레·코일링·초벌 페인팅 작품은 가마에 구운 뒤 30~45일 후 택배로 받고, 택배비는 따로 냅니다.
외부 음식은 가지고 들어갈 수 없습니다.',
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/seokbong-ceramic-museum.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=106',
  image_alt = '백자와 청자가 진열장에 놓인 석봉도자기미술관 내부'
where slug = 'sokcho-attraction-031' and activity_category is null;
update public.places set
  slug = 'expo-tower',
  summary = '청초호와 설악산, 동해를 한눈에 보는 73.4m 전망 타워',
  address = '강원특별자치도 속초시 엑스포로 72',
  latitude = 38.191535,
  longitude = 128.583341,
  official_url = 'https://www.pinodia.com/facilities/facilities6.php',
  activity_category = 'view',
  tags = array['indoor'],
  description = '청초호 옆에 서 있는 높이 73.4m의 전망 타워로, 전망대에서 청초호와 속초 시내, 동해, 울산바위 방향을 둘러봅니다. 밤 10시까지 열어 야경을 보러 가기에도 맞고 20~30분이면 충분합니다. 실내 전망대라 비가 와도 올라갈 수 있지만 흐린 날에는 먼 풍경이 잘 보이지 않습니다.',
  hours_summary = '매일 09:00~22:00, 입장 마감 21:30',
  closed_summary = '연중무휴',
  price_summary = '어른 2,500원 · 청소년 2,000원 · 어린이 1,500원',
  phone = '033-637-5083',
  parking_summary = '엑스포타워 주차장 2시간 무료, 이후 15분당 500원',
  cautions = '입장 마감 시각이 안내마다 21:30과 21:40으로 달라 늦은 시간에는 여유를 두고 가야 합니다.
청소년·어린이 요금은 증빙 서류가 필요할 수 있습니다.',
  booking_url = 'https://m.booking.naver.com/booking/5/bizes/1631737',
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/expo-tower.webp',
  image_credit = '사진: Steve46814, CC BY-SA 3.0 (위키미디어 공용) · 원본에서 잘라냄',
  image_source_url = 'https://commons.wikimedia.org/wiki/File:Korea-Sokcho-Expo_Tower-01.jpg',
  image_alt = '밤에 불을 밝힌 속초 엑스포타워와 청초호 주변'
where slug = 'sokcho-attraction-035' and activity_category is null;
update public.places set
  slug = 'sokcho-lighthouse-observatory',
  name = '속초등대전망대',
  summary = '영금정 옆 언덕에서 속초 앞바다를 내려다보는 무료 등대 전망대',
  address = '강원특별자치도 속초시 영금정로5길 8-28',
  latitude = 38.213639,
  longitude = 128.600278,
  official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=e5eefdfb-cbc8-4a23-b0e8-d6fdc0fb97b0',
  activity_category = 'view',
  tags = array['free'],
  description = '영금정 옆 언덕 위에 있는 속초등대의 전망대로, 속초항과 동해, 설악산 쪽을 함께 내려다볼 수 있습니다. 입장료가 없고 영금정·동명항과 가까워 산책길에 30분쯤 들르기에 맞습니다. 야외 구간이 많아 맑은 날에 가는 편이 좋습니다.',
  hours_summary = '전망대 09:00~17:00, 야외 공간 09:00~18:00',
  closed_summary = '연중무휴',
  price_summary = '무료',
  phone = '033-633-3406',
  parking_summary = null,
  cautions = '실내 전망대는 야외 공간보다 한 시간 이른 17:00에 닫습니다.
언덕 위에 있어 계단을 걸어 올라가야 하고, 바람이 강한 날에는 야외 전망이 불편할 수 있습니다.',
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = '2026-11-21',
  image_url = '/places/sokcho-lighthouse-observatory.webp',
  image_credit = '사진: Christophe95, CC BY-SA 4.0 (위키미디어 공용) · 원본에서 잘라냄',
  image_source_url = 'https://commons.wikimedia.org/wiki/File:Sokcho_from_the_Lighthouse_Observatory_1.jpg',
  image_alt = '속초등대전망대에서 내려다본 동명항과 속초 시내'
where slug = 'sokcho-attraction-045' and activity_category is null;
update public.places set
  slug = 'national-mountaineering-school',
  summary = '국립 인공암벽장과 등산·클라이밍 교육 과정을 운영하는 학교',
  address = '강원특별자치도 속초시 미시령로 3056',
  latitude = 38.202195,
  longitude = 128.541643,
  official_url = 'https://komount.or.kr/nationalmschool/',
  activity_category = 'experience',
  tags = array['reservation'],
  description = '한국등산·트레킹지원센터가 운영하는 등산 교육 기관으로, 실내외 인공암벽장과 강의실·숙소를 갖추고 있습니다. 일반인은 2시간 안팎의 스포츠클라이밍 기초교육이나 1박 2일 이상의 등산·암벽·빙벽 과정에 신청해 참여할 수 있습니다. 인공암벽장 자유 이용은 장비와 경험을 갖춘 사람을 대상으로 하며 예약제로 운영합니다. 실외 암벽과 야외 교육은 날씨에 따라 일정이 바뀔 수 있습니다.',
  hours_summary = '인공암벽장 10:00~17:00. 스포츠클라이밍 기초교육은 2~11월 수·목요일 10:00~11:30(무료), 14:00~16:30(유료)',
  closed_summary = '인공암벽장 매주 월요일 휴장',
  price_summary = '인공암벽장 시설사용료 무료 · 스포츠클라이밍 기초교육 90분 무료, 150분 17,820원 · 숙박형 교육은 과정별(레츠고 산에가자 1박 2일 51,000원 등)',
  phone = '033-632-6650',
  parking_summary = null,
  cautions = '인공암벽장 자유 이용은 숲나들e에서 사전 예약해야 하고, 암벽화·안전벨트·로프 등 개인 장비가 없으면 이용할 수 없습니다.
등반 경험이 없는 가족·청소년은 인공암벽장 자유 이용이 불가하며, 학교 교육 프로그램으로 체험해야 합니다.
스포츠클라이밍 기초교육은 전화(033-632-6653)로 날짜와 인원을 예약하며, 회당 5명 이상일 때 진행합니다.
내부 교육 일정, 기상 악화, 시설 보수로 일정이 취소되거나 시간이 바뀔 수 있습니다.',
  booking_url = 'https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID07030001',
  operation_status = 'open',
  status_note = '스포츠클라이밍 기초교육은 2월부터 11월까지만 진행합니다.',
  verified_on = '2026-11-21',
  image_url = '/places/national-mountaineering-school.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=120',
  image_alt = '설악산 봉우리를 배경으로 선 국립속초등산학교 건물'
where slug = 'sokcho-attraction-027' and activity_category is null;
update public.places set
  slug = 'dinosaur-ridge',
  summary = '설악산 마등령과 신선대를 잇는 바위 능선',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=82',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/dinosaur-ridge.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=82',
  image_alt = '구름 위로 솟은 설악산 공룡능선의 바위 봉우리'
where slug = 'sokcho-attraction-012' and activity_category is null;
update public.places set
  slug = 'gwongeumseong',
  summary = '설악케이블카로 오르는 설악산 봉우리의 옛 산성터',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=81',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/gwongeumseong.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=81',
  image_alt = '단풍 든 산 사이로 솟은 권금성 바위 봉우리'
where slug = 'sokcho-attraction-013' and activity_category is null;
update public.places set
  slug = 'geumganggul-cave',
  summary = '설악산 비선대 위 절벽 중턱의 자연 동굴',
  official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=3e0da4de-c6aa-4216-bdf9-2f7aef816eb2',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = null,
  image_credit = null,
  image_source_url = null,
  image_alt = null
where slug = 'sokcho-attraction-049' and activity_category is null;
update public.places set
  slug = 'dalmabong-peak',
  summary = '설악산 소공원 동쪽에 솟은 바위 봉우리',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=80',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/dalmabong-peak.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=80',
  image_alt = '파란 하늘 아래 바위로 솟은 달마봉'
where slug = 'sokcho-attraction-014' and activity_category is null;
update public.places set
  slug = 'daepo-port',
  summary = '튀김골목과 수산시장이 있는 속초 남쪽 항구',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=104',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/daepo-port.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=104',
  image_alt = '대포항의 보행교와 정박한 배들'
where slug = 'daepo-port' and activity_category is null;
update public.places set
  slug = 'dongmyeong-port',
  summary = '영금정 옆 활어회센터가 있는 항구',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=103',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/dongmyeong-port.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=103',
  image_alt = '바다 쪽에서 본 동명항 방파제와 등대 언덕'
where slug = 'sokcho-attraction-032' and activity_category is null;
update public.places set
  slug = 'beombawi-rock',
  summary = '영랑호 둘레길 옆의 커다란 바위',
  official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=899855c5-8cc4-4ec1-89d8-36bd2166016e',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = null,
  image_credit = null,
  image_source_url = null,
  image_alt = null
where slug = 'sokcho-attraction-046' and activity_category is null;
update public.places set
  slug = 'bogwangsa-temple',
  summary = '영랑호 근처의 사찰',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=36',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/bogwangsa-temple.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=36',
  image_alt = '잔디 마당 뒤로 선 보광사 법당'
where slug = 'sokcho-attraction-042' and activity_category is null;
update public.places set
  slug = 'biryong-falls',
  summary = '설악산 소공원에서 걸어가는 계곡 폭포',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=79',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/biryong-falls.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=79',
  image_alt = '단풍 든 바위 절벽 사이로 떨어지는 비룡폭포'
where slug = 'sokcho-attraction-015' and activity_category is null;
update public.places set
  slug = 'seoraksan-sogongwon',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=74',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/seoraksan-sogongwon.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=74',
  image_alt = '하늘에서 본 단풍철 설악산 소공원'
where slug = 'seoraksan-sogongwon' and activity_category is null;
update public.places set
  slug = 'seoraksan-native-botanical-garden',
  summary = '설악산에 자라는 식물을 모아 둔 식물원',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=77',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/seoraksan-native-botanical-garden.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=77',
  image_alt = '징검다리가 놓인 설악산자생식물원 연못'
where slug = 'sokcho-attraction-017' and activity_category is null;
update public.places set
  slug = 'seorak-sunrise-park',
  summary = '대포항 근처 바닷가의 조각 공원',
  official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=cb5d1e65-148e-44fd-99e8-6fc06d29a29a',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = null,
  image_credit = null,
  image_source_url = null,
  image_alt = null
where slug = 'sokcho-attraction-044' and activity_category is null;
update public.places set
  slug = 'sokcho-tourist-fish-market',
  summary = '닭강정·건어물 가게가 모인 속초 대표 전통시장',
  official_url = 'https://www.sokcho-central.co.kr/',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = null,
  image_credit = null,
  image_source_url = null,
  image_alt = null
where slug = 'sokcho-attraction-043' and activity_category is null;
update public.places set
  slug = 'sokcho-port',
  summary = '여객선이 드나드는 속초 도심의 항구',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=101',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/sokcho-port.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=101',
  image_alt = '크루즈가 정박한 속초항과 여객터미널'
where slug = 'sokcho-attraction-033' and activity_category is null;
update public.places set
  slug = 'sokcho-beach',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=87',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/sokcho-beach.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=87',
  image_alt = '이정표와 SOKCHO 글자가 있는 속초해수욕장 백사장'
where slug = 'sokcho-beach' and activity_category is null;
update public.places set
  slug = 'sinheungsa',
  summary = '설악산 소공원 안의 오래된 절과 통일대불',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=43',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/sinheungsa.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=43',
  image_alt = '꽃나무 사이로 보이는 신흥사 통일대불'
where slug = 'sokcho-attraction-037' and activity_category is null;
update public.places set
  slug = 'abai-village',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=56',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/abai-village.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=56',
  image_alt = '가게가 늘어선 아바이마을 골목'
where slug = 'abai-village' and activity_category is null;
update public.places set
  slug = 'abai-gaetbae',
  summary = '줄을 당겨 청초호 물길을 건너는 작은 배',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=118',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/abai-gaetbae.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=118',
  image_alt = '청초호 물길을 건너는 아바이마을 갯배'
where slug = 'sokcho-attraction-028' and activity_category is null;
update public.places set
  slug = 'yeonggeumjeong',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=42',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/yeonggeumjeong.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=42',
  image_alt = '파도가 부서지는 바위 위의 영금정 정자'
where slug = 'yeonggeumjeong' and activity_category is null;
update public.places set
  slug = 'yeongrang-lake',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=71',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/yeongrang-lake.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=71',
  image_alt = '벚꽃 너머로 보이는 영랑호와 설악산'
where slug = 'yeongrang-lake' and activity_category is null;
update public.places set
  slug = 'yeongrangho-barefoot-trail',
  summary = '영랑호 둘레의 맨발 걷기 황톳길',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=164',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/yeongrangho-barefoot-trail.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=164',
  image_alt = '소나무 숲 사이의 영랑호 맨발 황톳길'
where slug = 'sokcho-attraction-024' and activity_category is null;
update public.places set
  slug = 'yeongrangho-wetland-park',
  summary = '영랑호 습지를 따라 걷는 생태공원',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=163',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/yeongrangho-wetland-park.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=163',
  image_alt = '덩굴 터널 아래 디딤돌 길'
where slug = 'sokcho-attraction-025' and activity_category is null;
update public.places set
  slug = 'oeyongchi-bada-hyanggiro',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=70',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = '보수공사로 일부 구간 통행을 막았다는 안내가 있었어요. 방문 전에 확인해 주세요.',
  verified_on = null,
  image_url = '/places/oeyongchi-bada-hyanggiro.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=70',
  image_alt = '바위 해안을 따라 놓인 외옹치 바다향기로 데크길'
where slug = 'oeyongchi-bada-hyanggiro' and activity_category is null;
update public.places set
  slug = 'oeongchi-beach',
  summary = '외옹치항 옆의 작은 해변',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=86',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/oeongchi-beach.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=86',
  image_alt = '파도가 밀려오는 외옹치해수욕장 백사장'
where slug = 'sokcho-attraction-011' and activity_category is null;
update public.places set
  slug = 'yukdam-falls',
  summary = '비룡폭포 가는 길에 이어진 여섯 개의 폭포',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=78',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = null,
  image_credit = null,
  image_source_url = null,
  image_alt = null
where slug = 'sokcho-attraction-016' and activity_category is null;
update public.places set
  slug = 'joyang-dong-prehistoric-site',
  summary = '청동기 시대 집터가 발견된 유적',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=41',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/joyang-dong-prehistoric-site.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/culture?contentSeq=41',
  image_alt = '잔디 언덕 위에 복원한 선사시대 움집'
where slug = 'sokcho-attraction-038' and activity_category is null;
update public.places set
  slug = 'cheongdaesan',
  summary = '속초 시내에서 가볍게 오르는 낮은 산',
  official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=e0b643ae-448d-4112-aef2-e45308d12e52',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = null,
  image_credit = null,
  image_source_url = null,
  image_alt = null
where slug = 'sokcho-attraction-047' and activity_category is null;
update public.places set
  slug = 'cheongcho-lake-park',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=72',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/cheongcho-lake-park.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=72',
  image_alt = '보트가 지나가는 청초호와 속초 시내'
where slug = 'cheongcho-lake-park' and activity_category is null;
update public.places set
  slug = 'cheongho-beach',
  summary = '아바이마을 옆의 작은 해변',
  official_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=1',
  activity_category = 'nature',
  tags = array['free'],
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = '/places/cheongho-beach.webp',
  image_credit = '사진: 속초시 관광 누리집',
  image_source_url = 'https://www.sokcho.go.kr/ct/tour/attraction/nature?contentSeq=1',
  image_alt = '파도가 치는 청호해수욕장과 해변 건물'
where slug = 'sokcho-attraction-022' and activity_category is null;
update public.places set
  slug = 'towangseong-falls-observatory',
  summary = '비룡폭포 위에서 토왕성폭포를 바라보는 전망대',
  official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=d6bba112-5e8f-4184-9c28-e625c4e1d894',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = null,
  image_credit = null,
  image_source_url = null,
  image_alt = null
where slug = 'sokcho-attraction-050' and activity_category is null;
update public.places set
  slug = 'heundeulbawi',
  summary = '계조암 앞의 흔들리는 큰 바위',
  official_url = 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=122e2deb-ef38-4902-97ee-dfbc0c74e395',
  activity_category = 'nature',
  tags = '{}',
  description = null,
  hours_summary = null,
  closed_summary = null,
  price_summary = null,
  phone = null,
  parking_summary = null,
  cautions = null,
  booking_url = null,
  operation_status = 'open',
  status_note = null,
  verified_on = null,
  image_url = null,
  image_credit = null,
  image_source_url = null,
  image_alt = null
where slug = 'sokcho-attraction-051' and activity_category is null;

-- 3. 명소에 없던 즐길거리 장소 넣기
insert into public.places
  (id, slug, name, category, summary, address, latitude, longitude, official_url, map_url, is_published, activity_category, tags, description, hours_summary, closed_summary, price_summary, phone, parking_summary, cautions, booking_url, operation_status, status_note, verified_on, image_url, image_credit, image_source_url, image_alt)
values
  ('20000000-0000-4000-8000-000000000201', 'lotte-resort-sokcho-waterpark', '롯데리조트 속초 워터파크', '워터파크', '대포항 옆 롯데리조트 속초의 실내외 워터파크', '강원특별자치도 속초시 대포항길 186', 38.180682, 128.612148, 'https://www.lottehotel.com/resort-sokcho/ko/themepark/water-park', 'https://map.naver.com/p/search/%EB%A1%AF%EB%8D%B0%EB%A6%AC%EC%A1%B0%ED%8A%B8%20%EC%86%8D%EC%B4%88%20%EC%9B%8C%ED%84%B0%ED%8C%8C%ED%81%AC', true, 'water', array['indoor', 'kids'], '롯데리조트 속초 지하 2층에 있는 워터파크로, 실내 파도풀과 슬라이드를 갖추고 있습니다. 투숙객이 아니어도 종일권을 사서 이용할 수 있고, 아이와 함께 한나절 보내기에 맞습니다. 실내 시설은 날씨와 관계없이 이용할 수 있지만 실외 구역은 공사와 기상에 따라 닫을 수 있습니다.', '실내 워터파크 매일 10:00~19:00. 실외 워터파크는 2026.9.1~12.15 공사로 미운영', '연중무휴', '종일권 대인 주중 50,000원 · 주말 55,000원, 소인 주중 40,000원 · 주말 45,000원', '033-634-1330', '무료', '아쿠아슈즈를 신어야 이용할 수 있으며 크록스·샌들·슬리퍼는 안 됩니다.
실외 워터파크는 옥상 캐노피 공사로 2026년 9월 1일부터 12월 15일까지 운영하지 않습니다.
소인은 36개월~초등학교 6학년이고 36개월 미만은 무료이며, 의료보험증이나 등본을 지참해야 합니다.
실외 시설은 강풍·낙뢰 등 기상 상황에 따라 이용이 제한될 수 있습니다.', null, 'open', '실외 워터파크는 2026년 12월 15일까지 공사로 쉽니다. 실내 워터파크는 운영합니다.', '2026-11-21', '/places/lotte-resort-sokcho-waterpark.webp', '사진: 롯데리조트 속초 공식 홈페이지', 'https://www.lottehotel.com/resort-sokcho/ko/themepark/water-park', '슬라이드와 인공 파도가 있는 롯데리조트 속초 실내 워터파크'),
  ('20000000-0000-4000-8000-000000000202', 'cheoksan-spa-resort', '척산온천휴양촌', '온천', '노천탕과 찜질방을 갖춘 척산온천지구의 온천 사우나', '강원특별자치도 속초시 관광로 327', 38.190216, 128.540710, 'https://www.choksan.co.kr/', 'https://map.naver.com/p/search/%EC%B2%99%EC%82%B0%EC%98%A8%EC%B2%9C%ED%9C%B4%EC%96%91%EC%B4%8C', true, 'water', array['indoor'], '척산온천지구에 있는 온천 숙박 시설로, 숙박하지 않아도 사우나와 찜질방을 요금을 내고 이용할 수 있습니다. 남녀 사우나에 노천탕이 딸려 있고 가족끼리 쓰는 가족온천실도 있습니다. 대부분 실내 시설이라 날씨와 관계없이 이용할 수 있습니다.', '사우나 매일 05:30~20:00(노천탕은 19:00까지), 찜질방 10:00~19:00', '연중무휴', '사우나 대인 11,000원 · 소인(1~6세) 7,000원, 사우나+찜질방 대인 20,000원 · 소인 15,000원', '033-636-4000', '무료', '가족온천실은 당일 전화 예약만 받으며 오전 9시부터 예약할 수 있습니다.
노천탕은 사우나보다 한 시간 이른 19:00에 마감합니다.', 'https://m.booking.naver.com/booking/5/bizes/47652', 'open', null, '2026-11-21', '/places/cheoksan-spa-resort.webp', '사진: 척산온천휴양촌 공식 홈페이지', 'https://www.choksan.co.kr/', '정자와 함께 있는 척산온천휴양촌 야외 수영장'),
  ('20000000-0000-4000-8000-000000000203', 'museum-x', '뮤지엄엑스', '전시관', '14가지 콘텐츠를 몸으로 체험하는 실내 미디어 전시관', '강원특별자치도 속초시 중앙로 338', 38.218910, 128.592372, 'https://www.museumx.co.kr/info', 'https://map.naver.com/p/search/%EB%AE%A4%EC%A7%80%EC%97%84%EC%97%91%EC%8A%A4', true, 'exhibition', array['indoor', 'kids'], '영랑동에 있는 실내 체험형 전시관으로, 입장권 하나로 기본 콘텐츠 14종을 돌아봅니다. 대화하며 초상화를 그려 주는 로봇 같은 AI 체험은 패키지 요금으로 추가할 수 있습니다. 전 구역이 실내라 비 오는 날이나 추운 날 아이와 함께 가기에 맞습니다.', '매일 10:00~18:00, 입장 마감 17:00', '연중무휴', '뮤지엄패스 대인 23,000원 · 소인 19,000원, 24개월 미만 무료', '033-635-0318', '본관 주차장 이용, 만차 시 제1주차장(영랑동 147-48)', '입장은 17:00에 마감합니다.
AI 체험 2종이 포함된 패키지는 대인 30,000원 · 소인 26,000원으로 요금이 다릅니다.
속초시민·경로·제휴 숙소 투숙객 할인은 증빙을 제시해야 적용됩니다.', 'https://map.naver.com/p/entry/place/1507146192?placePath=%2Fbooking', 'open', null, '2026-11-21', '/places/museum-x.webp', '사진: 속초시 관광 누리집', 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=107', '분홍빛 구름과 바다 영상이 벽을 채운 뮤지엄엑스 전시실'),
  ('20000000-0000-4000-8000-000000000204', 'cookie-castle', '과자의성', '체험시설', '빵 공장 견학과 쿠키 만들기를 함께 하는 실내 체험 공간', '강원특별자치도 속초시 미시령로 3010', 38.202751, 128.536424, 'https://cookie14.co.kr/35', 'https://map.naver.com/p/search/%EA%B3%BC%EC%9E%90%EC%9D%98%EC%84%B1', true, 'exhibition', array['indoor', 'kids'], '캐릭터빵을 만드는 제과 회사가 운영하는 복합 공간입니다. 1층에서 빵이 만들어지는 과정을 관람로로 보고 기념품점을 둘러본 뒤, 3층 체험장에서 쿠키·과자집·케이크 만들기 클래스에 참여하거나 카페에서 체험키트를 만들 수 있습니다. 클래스는 약 50분~1시간이 걸리며, 실내라 날씨와 상관없이 아이와 함께 가기 좋습니다.', '매일 10:00~18:00', '연중무휴', '입장료 없음 · 베이킹 클래스 25,000~29,000원 · 상시 체험키트 14,000~26,000원', '033-636-9701', '전용 주차장 무료(공식 안내 63대, 대형버스 가능). 만차 시 옆 교회 임시주차장 이용', '베이킹 클래스는 36개월 미만은 참여할 수 없고, 6세까지는 보호자 한 명이 함께 들어가야 합니다.
클래스는 네이버 예약이 우선이며, 자리가 남으면 체험 30분 전까지 현장 접수할 수 있습니다.
클래스 시작 후에는 입장할 수 없고, 지각이나 당일 취소는 환불이 거의 되지 않습니다.
상시 체험키트는 예약 없이 3층 카페에서 구입해 자유롭게 만들 수 있습니다.', 'https://m.booking.naver.com/booking/12/bizes/600513', 'open', null, '2026-11-21', '/places/cookie-castle.webp', '사진: 과자의성 공식 홈페이지', 'https://cookie14.co.kr/', '쟁반 위 쿠키에 토핑을 올리는 쿠키 만들기 체험'),
  ('20000000-0000-4000-8000-000000000205', 'alive-heart-sokcho', '얼라이브 하트', '전시관', '착시 그림 속에서 사진을 찍는 실내 트릭아트 전시관', '강원특별자치도 속초시 원암학사평길 88', 38.205535, 128.517387, 'https://www.instagram.com/aliveheart_sokcho/', 'https://map.naver.com/p/search/%EC%96%BC%EB%9D%BC%EC%9D%B4%EB%B8%8C%20%ED%95%98%ED%8A%B8', true, 'exhibition', array['indoor', 'kids'], '벽과 바닥에 그린 착시 그림 앞에서 사진을 찍으며 둘러보는 실내 전시관입니다. 운영사 소개에 따르면 체험로드 4개와 착시 포토존 60개로 구성되어 있습니다. 같은 건물의 다이나믹 메이즈와 묶은 패키지권도 판매하며, 실내라 비 오는 날 가족이나 친구와 가기 좋습니다.', '매일 10:00~17:50, 입장 마감 17:00', '연중무휴(시설 사정으로 쉴 때는 사전 공지)', '1인 12,000원(대소공통) · 36개월 미만 무료', '033-633-2004', '부지 내 주차장 무료', '36개월 미만은 무료이며 주민등록등본 등 증빙이 필요합니다.
퇴장하면 다시 들어갈 수 없고, 재입장하려면 현장에서 추가 요금을 냅니다.
연휴와 공휴일에는 입장 대기가 생길 수 있습니다.
음식물 반입과 반려동물 출입은 할 수 없습니다.', 'https://m.booking.naver.com/booking/5/bizes/40842', 'open', null, '2026-11-21', '/places/alive-heart-sokcho.webp', '사진: 속초시 관광 누리집', 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=115', '하트 조형물이 걸린 얼라이브 하트 건물 외관'),
  ('20000000-0000-4000-8000-000000000206', 'happy-owl-house', '해피아울하우스', '박물관', '세계 각국의 부엉이 수집품과 패브릭 작품을 보는 박물관', '강원특별자치도 속초시 바람꽃마을길 118', 38.200400, 128.523585, 'https://blog.naver.com/happyowlhous', 'https://map.naver.com/p/search/%ED%95%B4%ED%94%BC%EC%95%84%EC%9A%B8%ED%95%98%EC%9A%B0%EC%8A%A4', true, 'exhibition', array['indoor'], '부엉이를 주제로 한 사립 박물관 겸 갤러리로 전시관 5곳으로 이루어져 있습니다. 세계 여러 나라에서 모은 부엉이 수집품 5,000여 점과 패브릭 작가의 부엉이 작품을 함께 볼 수 있습니다. 규모가 크지 않은 실내 전시라 30분~1시간이면 둘러볼 수 있고, 설악산 자생식물원 근처에 있습니다.', '10:00~18:00, 입장 마감 17:30', '매주 월요일(공휴일인 월요일, 여름 휴가철, 명절 연휴에는 문을 여는 경우가 많음)', '성인 7,000원 · 초중고생 6,000원 · 소아(24개월 이상) 5,000원', '0507-1323-8475', '무료 주차 가능', '월요일은 정기 휴관이며, 임시 휴관이나 연휴 개관은 공식 블로그·인스타그램에 공지합니다.', null, 'open', null, '2026-11-21', '/places/happy-owl-house.webp', '사진: 속초시 관광 누리집', 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=105', '부엉이 조형물이 서 있는 해피아울하우스 건물 외관'),
  ('20000000-0000-4000-8000-000000000207', 'seorak-cable-car', '설악케이블카', '케이블카', '설악산 소공원에서 권금성까지 5분 만에 오르는 케이블카', '강원특별자치도 속초시 설악산로 1085', 38.173049, 128.489132, 'https://www.sorakcablecar.co.kr/', 'https://map.naver.com/p/search/%EC%84%A4%EC%95%85%EC%BC%80%EC%9D%B4%EB%B8%94%EC%B9%B4', true, 'view', array['kids'], '설악산 소공원에서 권금성까지 왕복하는 케이블카로, 편도 5분이면 정상부에 닿습니다. 등산이 어려운 어린이나 어르신과 함께 설악산 전망을 보기에 맞고, 대기와 권금성 구경을 합쳐 1~2시간쯤 잡으면 됩니다. 바람과 날씨 영향을 크게 받아 당일 운행 여부와 시간을 확인하고 가야 합니다.', '시즌별로 다름. 계절과 기상에 따라 매일 달라지며 당일 운행시간은 공식 홈페이지 첫 화면에 게시', '연중무휴(강풍·악천후 시 운행 중단)', '왕복 대인(중학생 이상) 16,000원 · 소인(37개월~초등학생) 12,000원, 36개월 미만 무료', '033-636-4300', '전용 주차장 없음, 설악산 소공원(신흥사) 유료 주차장 이용', '사전 예약은 받지 않고 당일 현장 매표소에서만 표를 삽니다.
강풍이나 악천후에는 운행을 멈추며, 쓰지 않은 탑승권은 전액 환불됩니다.
왕복권만 팔고 유모차는 탈 수 없어 탑승장 밖 무료 보관소에 맡겨야 합니다.
마지막 케이블카로 올라가면 권금성에서 20분 정도만 머물 수 있습니다.', null, 'open', null, '2026-11-21', '/places/seorak-cable-car.webp', '사진: Bernard Gagnon, CC0 (위키미디어 공용)', 'https://commons.wikimedia.org/wiki/File:Seoraksan_Cable_Car_04.jpg', '설악산 숲 위를 지나는 설악케이블카'),
  ('20000000-0000-4000-8000-000000000208', 'sokcho-eye', '속초아이 대관람차', '대관람차', '속초해수욕장 앞에서 바다를 내려다보는 65m 대관람차', '강원특별자치도 속초시 청호해안길 2', 38.190941, 128.602946, 'https://www.instagram.com/sokchoeye', 'https://map.naver.com/p/search/%EC%86%8D%EC%B4%88%EC%95%84%EC%9D%B4%20%EB%8C%80%EA%B4%80%EB%9E%8C%EC%B0%A8', true, 'view', array['kids'], '속초해수욕장 광장에 있는 높이 약 65m의 대관람차로, 6인승 캐빈 36개가 돕니다. 바다와 속초 시내, 설악산을 함께 볼 수 있어 아이와 함께 타기에 맞습니다. 바람과 비의 영향을 받아 운행이 바뀔 수 있고, 철거 관련 소송이 진행 중이라 방문 전에 운영 여부를 확인하는 편이 좋습니다.', '일~금 10:00~20:00, 토 10:00~21:00, 마감 30분 전 발권·입장 마감', '연중무휴(강풍·우천 등 기상 악화나 정기 점검 때는 변동)', '대인 12,000원 · 소인(36개월~미취학) 6,000원 · 36개월 미만 무료', '0507-1482-0107', '전용 주차장 없음, 속초해수욕장 1·2 공영주차장(유료) 이용', '철거를 둘러싼 행정소송 항소심 선고가 2027년 1월 27일로 잡혀 있어, 그 뒤 운영 여부가 달라질 수 있습니다.
강풍·비 등 기상 악화나 정기 점검 때는 운영시간이 바뀌거나 운행을 멈춥니다.
초등학생 이하는 성인 보호자와 함께 타야 합니다.
소인·경로 등 할인 요금은 증빙 서류를 지참해야 적용됩니다.', 'https://m.booking.naver.com/booking/12/bizes/798265', 'open', '철거 명령을 둘러싼 소송이 진행 중이라 운영이 바뀔 수 있습니다. 방문 전에 운영 여부를 확인해 주세요.', '2026-11-21', '/places/sokcho-eye.webp', '사진: HE YUNONG, CC BY-SA 4.0 (위키미디어 공용) · 원본에서 잘라냄', 'https://commons.wikimedia.org/wiki/File:Sokcho_Ferris_Wheel,_Korea.jpg', '속초해수욕장 앞에 선 대관람차 속초아이'),
  ('20000000-0000-4000-8000-000000000209', 'dynamic-maze-sokcho', '다이나믹메이즈 속초', '테마파크', '장애물을 넘으며 해저 미로를 탈출하는 실내 체험', '강원특별자치도 속초시 원암학사평길 88', 38.205574, 128.517329, null, 'https://map.naver.com/p/search/%EB%8B%A4%EC%9D%B4%EB%82%98%EB%AF%B9%EB%A9%94%EC%9D%B4%EC%A6%88%20%EC%86%8D%EC%B4%88', true, 'themepark', array['indoor', 'kids'], '해저 도시를 주제로 꾸민 실내 미로에서 장애물을 넘고 미션을 풀며 출구를 찾아가는 몸으로 하는 체험입니다. 얼라이브 하트와 같은 건물에 있어 두 곳을 묶은 패키지권으로 함께 이용하는 사람이 많습니다. 뛰고 기어가는 구간이 있어 편한 바지와 양말 차림이 좋고, 실내라 날씨와 상관없이 즐길 수 있습니다.', '매일 10:00~17:50, 입장 마감 17:00', '연중무휴(시설 사정으로 쉴 때는 사전 공지)', '1인 12,000원(대소공통)', '033-633-2004', '부지 내 주차장 무료', '키 100cm 미만은 이용할 수 없으며 입장 전에 직원이 확인합니다.
초등학생 이하 어린이는 성인 보호자와 함께 들어가야 하고, 보호자 한 명당 어린이 5명까지 입장할 수 있습니다.
체험은 한 번만 할 수 있고 끝난 뒤에는 다시 들어갈 수 없습니다.
노약자, 임산부는 체험이 제한될 수 있고, 휠체어와 유모차는 가지고 들어갈 수 없습니다.', 'https://m.booking.naver.com/booking/5/bizes/40841', 'open', null, '2026-11-21', null, null, null, null),
  ('20000000-0000-4000-8000-000000000210', 'laser-attack-sokcho', '레이저어택 속초점', '실내 놀이', '속초관광수산시장 앞 실내 레이저 서바이벌 게임장', '강원특별자치도 속초시 청초호반로 329-1 3층', 38.203328, 128.591367, 'https://www.instagram.com/laser_attack', 'https://map.naver.com/p/search/%EB%A0%88%EC%9D%B4%EC%A0%80%EC%96%B4%ED%83%9D%20%EC%86%8D%EC%B4%88%EC%A0%90', true, 'themepark', array['indoor'], '조끼와 레이저 총을 착용하고 실내 경기장에서 점수를 겨루는 서바이벌 게임장입니다. 개인전·팀전과 연발·단발·스나이퍼 모드가 있고, 게임이 끝나면 적중률과 순위를 확인할 수 있습니다. BB탄 사격 코너도 따로 있습니다. 속초관광수산시장 건너편 건물 3층에 있어 비 오는 날에도 이용할 수 있습니다.', '평일 13:00~18:50, 주말·공휴일 11:00~19:50. 성수기 평일은 주말 시간으로 운영', '매주 화요일', '기본 2게임 1인 14,000원 · 1게임 추가 5,000원 · 평일 1시간 이용권 20,000원', '0507-1370-6117', '전용 주차장이 없어 중앙부두길 24 공영주차장을 이용합니다(주차비 지원 없음).', '대기를 줄이려면 네이버 톡톡으로 예약한 뒤 방문하는 것이 좋습니다.
7~8월 성수기에는 원하는 시간대 예약이 일찍 마감될 수 있습니다.
영업 종료 약 35분 전에 마지막 입장을 마감합니다.', null, 'open', null, '2026-11-21', null, null, null, null),
  ('20000000-0000-4000-8000-000000000211', 'sokcho-marina', '속초마리나', '요트', '청초호에서 출항해 조도까지 도는 50분 요트투어', '강원특별자치도 속초시 철새길 106', 38.192312, 128.589743, 'http://www.sokchomarina.co.kr/default/', 'https://map.naver.com/p/search/%EC%86%8D%EC%B4%88%EB%A7%88%EB%A6%AC%EB%82%98', true, 'marine', array['kids', 'reservation'], '청초호 엑스포공원 안 마리나에서 출항해 설악대교, 속초해수욕장, 조도를 돌아오는 약 50분 요트투어를 운영합니다. 다른 승객과 함께 타는 퍼블릭투어와 일행만 타는 단독투어가 있고, 인원과 기상에 따라 세일요트나 카타마란이 배정됩니다. 같은 건물에 카페와 수제맥주 펍이 있어 승선 전후로 머물기 좋습니다. 바다 상태에 따라 코스가 바뀌거나 운항이 취소될 수 있습니다.', '요트투어 매일 09:00~18:00 운항(계절·일몰·기상에 따라 변동), 매표소·시설 09:00~19:00', '연중무휴(기상 악화 시 운항 취소)', '퍼블릭 요트투어(약 50분) 대인 35,000원 · 소인(37개월~초등) 25,000원, 36개월 이하 무료', '033-633-7733', '전용 주차장 약 100대, 요트투어·카페 이용객 3시간 무료', '사전 예약이 필수이며, 당일 예약은 남은 좌석에 한해 전화로만 받습니다.
기상 특보로 출항하지 못하면 전액 환불되고, 비만 오는 날은 우비를 제공하고 운항합니다.
하이힐·워커·부츠는 신고 탈 수 없고, 외부 음식과 주류, 반려동물은 반입할 수 없습니다.
36개월 미만 유아도 예약 인원에 포함해야 하며, 임산부는 탑승 동의서를 작성합니다.', 'https://booking.naver.com/booking/6/bizes/98726', 'open', null, '2026-11-21', '/places/sokcho-marina.webp', '사진: 속초시 관광 누리집', 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=127', '청초호에 정박한 요트들과 속초 시내'),
  ('20000000-0000-4000-8000-000000000212', 'komarine-yacht', '코마린요트', '요트', '청초호 요트공원에서 타는 세일요트·파워요트', '강원특별자치도 속초시 엑스포로 10-29', 38.191451, 128.593223, 'https://www.komarine.kr/36', 'https://map.naver.com/p/search/%EC%BD%94%EB%A7%88%EB%A6%B0%EC%9A%94%ED%8A%B8', true, 'marine', '{}', '청초호 변 요트공원에서 세일요트와 파워요트를 운항하는 곳으로, 속초 고속버스터미널에서 걸어서 10분 거리입니다. 기본 B코스는 등대와 조도 쪽 바다를 돌고 오며, 시간 단위로 요트를 통째로 빌릴 수도 있습니다. 인천 송도에서 수상레저를 운영하는 코마린이 속초에서 운영하는 사업장입니다. 바다 상태에 따라 코스가 바뀌거나 운항이 쉬는 날이 있습니다.', '매일 09:00~18:00, 매 정시 출항', '기상 상황에 따라 휴무', 'B코스(기본) 대인 36,000원 · 소인 24,000원, A코스(주의보 발효 시) 대인 20,000원 · 소인 14,000원', '033-637-4609', '주차장 있음', '기상 상황에 따라 운항하지 않거나, 주의보가 내려지면 청초호 안쪽만 도는 A코스로 바뀝니다.
온라인 예약 페이지가 없어 전화로 출항 시간과 가능 여부를 확인해야 합니다.
정시 출항이 아닌 단독 운항을 원하면 최소 출항 금액이 적용됩니다.', null, 'open', '겨울 운항 여부는 방문 전에 전화로 확인해 주세요.', '2026-11-21', '/places/komarine-yacht.webp', '사진: 속초시 관광 누리집', 'https://www.sokcho.go.kr/ct/tour/attraction/experience?contentSeq=124', '해 질 녘 바다 위를 지나는 세일요트'),
  ('20000000-0000-4000-8000-000000000213', 'iloveyou-yacht-sokcho', '아이러브유요트', '요트', '청초호에서 출항하는 47인승 요트의 주간·야간 투어', '강원특별자치도 속초시 엑스포로 10-29', 38.191327, 128.593185, 'https://blog.naver.com/wktjd2277', 'https://map.naver.com/p/search/%EC%95%84%EC%9D%B4%EB%9F%AC%EB%B8%8C%EC%9C%A0%EC%9A%94%ED%8A%B8', true, 'marine', array['kids'], '청초호 코마린 계류장에서 47인승 요트로 설악대교, 아바이마을, 조도를 돌아오는 약 50분 투어를 운영합니다. 낮 투어 외에 선셋과 야간 투어가 있고, 일행만 타는 단독 투어와 프러포즈 패키지도 받습니다. 부산에서 요트투어를 하던 사업자가 속초에서 운영하는 곳입니다. 가벼운 비에는 운항하지만 특보가 내려지면 취소됩니다.', '매일 운영, 주간·선셋·야간 투어(출항 시간은 예약 시 확인)', '연중무휴(기상 악화 시 운항 취소)', '퍼블릭 요트투어 주간 대인 35,000원 · 소인 25,000원, 야간 대인 40,000원 · 소인 30,000원', '1533-7880', '무료 주차', '출항 시간은 예약할 때 전화나 네이버 예약으로 확인해야 합니다.
태풍·강풍·호우 특보가 내려지면 운항하지 않고 일정을 바꾸거나 환불합니다.
코마린 계류장을 함께 쓰는 다른 요트 업체가 있으니 예약한 업체 이름을 확인하고 탑승합니다.', 'https://booking.naver.com/booking/12/bizes/733377', 'open', null, '2026-11-21', null, null, null, null),
  ('20000000-0000-4000-8000-000000000214', 'sokcho-yacht-boat-club', '속초요트보트클럽', '요트', '장사항에서 타는 제트보트와 요트', '강원특별자치도 속초시 장사항해안길 42', 38.225361, 128.588804, null, 'https://map.naver.com/p/search/%EC%86%8D%EC%B4%88%EC%9A%94%ED%8A%B8%EB%B3%B4%ED%8A%B8%ED%81%B4%EB%9F%BD', true, 'marine', array['reservation'], '장사항에서 속도감 있는 제트보트와 요트를 운항하는 곳으로, 속초파워보트클럽이라는 이름으로도 알려져 있습니다. 보트는 속초등대 방향과 봉포 방향 두 코스가 있습니다. 날씨 영향을 크게 받아 이용 전에 전화로 운영 여부를 확인해야 합니다. 같은 건물에 장사항마리나 등 다른 업체가 있어 상호를 확인하고 찾아가야 합니다.', '매일 11:00~18:30', '연중무휴(제트보트는 매년 4월 1일~12월 10일만 운영)', '보트 성인 25,000원 · 소인 20,000원, 요트 성인 35,000원 · 소인 25,000원', '033-637-8852', '무료 주차', '예매 후 이용 전에 전화로 운영 여부를 확인해야 하고, 주말·공휴일은 3일 전 확인이 필요합니다.
제트보트는 매년 4월 1일부터 12월 10일까지만 운영합니다.
기상이 나쁘면 당일에도 출항이 취소될 수 있습니다.
어린이는 보호자와 함께 타야 하고, 48개월 미만은 증빙 서류를 내면 무료입니다.', 'https://booking.naver.com/booking/5/bizes/1545604', 'open', '제트보트는 12월 10일까지만 운영합니다.', '2026-11-21', null, null, null, null),
  ('20000000-0000-4000-8000-000000000215', 'jangsahang-marina', '장사항마리나', '요트', '장사항에서 출항하는 세일요트 투어', '강원특별자치도 속초시 장사항해안길 42', 38.225485, 128.588901, 'https://blog.naver.com/fcm2', 'https://map.naver.com/p/search/%EC%9E%A5%EC%82%AC%ED%95%AD%EB%A7%88%EB%A6%AC%EB%82%98', true, 'marine', array['kids'], '속초 북쪽 장사항에서 세일요트를 타고 동해로 나가 속초등대와 조도, 바다에서 보는 설악산을 둘러보는 투어입니다. 다른 승객과 함께 타는 투어와 최대 10명이 일행끼리만 타는 단독 투어가 있습니다. 돛을 펴고 바람으로만 가는 구간이 있어 조용히 바다를 보기 좋습니다. 풍랑주의보나 일몰 시간에 따라 운항 시간이 달라집니다.', '매일 09:00~18:00, 매 정시 출항(일몰 시간·풍랑주의보에 따라 변동)', '정기 휴무 없음(풍랑주의보 시 운항 취소)', '세일요트 투어 대인 35,000원 · 소인(만 4~12세) 25,000원', '033-636-8850', '매장 앞 또는 장사항 공용 주차장, 무료', '매 정시에 출항하므로 예약 시간 15분 전까지 도착해야 하고, 늦으면 환불되지 않습니다.
풍랑주의보가 내려지면 운항이 취소되고 전액 환불됩니다.
이용 2일 전부터 취소 수수료가 있고, 취소는 업체에 전화로 요청해야 전액 환불됩니다.
만 4세 미만 유아도 유아 탑승권으로 인원에 넣어 예약해야 합니다.', 'https://booking.naver.com/booking/12/bizes/1208339', 'open', null, '2026-11-21', null, null, null, null),
  ('20000000-0000-4000-8000-000000000216', 'bada-surf', '바다서프', '서핑', '속초해수욕장 남문 앞 서핑 강습·렌탈숍', '강원특별자치도 속초시 새마을길 66', 38.186116, 128.605421, 'https://www.badasurf.com/', 'https://map.naver.com/p/search/%EB%B0%94%EB%8B%A4%EC%84%9C%ED%94%84', true, 'marine', '{}', '속초해수욕장 남문 앞에 있는 서핑숍으로, 해수욕객과 나뉜 서핑 전용 구간에서 강습합니다. 처음 타는 사람을 위한 입문강습은 안전교육을 포함해 2시간이고, 끝난 뒤 보드를 계속 쓰며 자유롭게 탈 수 있습니다. 보드와 웻슈트만 빌릴 수도 있습니다. 파도와 날씨에 따라 강습 시간이 바뀌거나 취소될 수 있습니다.', '매일 09:00~18:00(고객센터 기준), 입문강습 10:00 · 13:00 · 15:00 시작', '연중무휴(풍랑주의보 등 기상에 따라 강습 변경·취소)', '입문강습(2시간, 보드·프리서핑 2시간 포함) 65,000원, 웻슈트 대여 10,000원 별도', '033-633-1611', '서핑숍 뒤편 무료 주차, 만차 시 맞은편 임시 공영주차장(유료)', '초등학생 이하 어린이는 보호자가 함께 강습을 받아야 합니다.
파도가 높으면 강습 후 프리서핑이 제한될 수 있고, 풍랑주의보 때는 전액 환불됩니다.
웻슈트는 강습비에 들어 있지 않아 따로 빌려야 합니다.
강습 당일 취소는 환불되지 않습니다.', 'https://booking.naver.com/booking/12/bizes/174333', 'open', null, '2026-11-21', '/places/bada-surf.webp', '사진: 바다서프 공식 홈페이지', 'https://www.badasurf.com/', '얕은 바다에서 서핑보드를 타는 강습 장면'),
  ('20000000-0000-4000-8000-000000000217', 'sunrise-surf', '선라이즈 서프', '서핑', '일출·일몰 서핑과 해변 요가를 하는 서핑숍', '강원특별자치도 속초시 청호로4길 28 1층', 38.194215, 128.599225, 'https://www.instagram.com/sunrise_surf_yoga/', 'https://map.naver.com/p/search/%EC%84%A0%EB%9D%BC%EC%9D%B4%EC%A6%88%20%EC%84%9C%ED%94%84', true, 'marine', array['reservation'], '아바이마을 벽화골목에 있는 서핑숍으로, 해 뜰 무렵과 해 질 무렵 바다에 나가는 일출·일몰 서핑을 운영합니다. 처음 타는 사람을 위한 입문 강습과 해변 요가, 1~3일 초보자 캠프도 있습니다. 보드와 샤워 시설, 수건이 제공됩니다. 파도와 날씨, 예약 인원에 따라 일정이 바뀔 수 있습니다.', '매일 05:00~20:00, 일출·일몰 서핑 05:00 · 17:00, 입문 서핑 10:00 · 13:00 · 15:00(일출·일몰 시간에 따라 변동)', null, '입문 서핑(3시간) 55,000원, 일출·일몰 서핑(3시간) 65,000원', '010-7156-6037', '속초해수욕장 공영주차장(유료) 또는 아바이 벽화마을 길가 주차', '파도·바람·조류나 예약 인원 부족으로 강습이 변경되거나 취소될 수 있습니다.
일출·일몰 시간에 따라 시작 시간이 바뀌며, 바뀌면 문자로 알려줍니다.
웻슈트는 따로 예약해야 하고 키·몸무게·성별을 미리 알려야 합니다.', 'https://booking.naver.com/booking/12/bizes/963483', 'open', '겨울 강습 여부는 방문 전에 확인해 주세요.', '2026-11-21', null, null, null, null),
  ('20000000-0000-4000-8000-000000000218', 'sinheungsa-templestay', '신흥사 템플스테이', '템플스테이', '설악산 신흥사에서 하룻밤 머무는 사찰 체험', '강원특별자치도 속초시 설악산로 1137', 38.175376, 128.484703, 'https://www.templestay.com/fe/MI000000000000000062/temple/introView.do?templeId=SeoraksanSinheungsa', 'https://map.naver.com/p/search/%EC%8B%A0%ED%9D%A5%EC%82%AC%20%ED%85%9C%ED%94%8C%EC%8A%A4%ED%85%8C%EC%9D%B4', true, 'experience', array['reservation'], '설악산 소공원 안 신흥사에서 운영하는 템플스테이입니다. 사찰 예절 배우기, 단주 만들기, 예불, 108배와 걷기 명상, 스님과의 차담, 설악산 탐방로 산책으로 구성되며 1박 2일이 기본입니다. 일정 대부분을 자유롭게 고르는 휴식+체험형, 선명상 중심의 주말체험형, 단체용 당일형(약 4시간 30분)이 있습니다. 비나 폭염 때는 프로그램 내용이 바뀔 수 있습니다.', '1박 2일형은 첫날 14:00 체크인, 다음 날 10:00 퇴실. 전화 상담 09:00~11:00, 13:00~17:00', '매주 월요일 휴관', '1박 2일 휴식+체험형 성인·중고생 90,000원, 초등생·미취학 80,000원 · 주말체험형 성인 100,000원 · 당일형(단체) 40,000원', '033-636-8001', '참가자는 공원 입구에서 템플스테이 참가자임을 알리고 안내받은 무료주차장을 이용합니다. 만차일 때(특히 단풍철)는 유료주차장을 써야 합니다.', '템플스테이 홈페이지에서 프로그램 시작 5일 전까지 예약해야 합니다(당일형 단체는 7일 전, 전화 상담 우선).
체크인 시간(14:00)에 늦으면 입실할 수 없습니다.
미성년자는 보호자와 함께 참가해야 하고, 75세 이상은 돌봄 가능한 동반자가 필요합니다.
사찰 안에서는 음주·흡연과 외부 음식 반입이 금지되며 21시에 소등합니다.', 'https://www.templestay.com/fe/MI000000000000000062/temple/introView.do?templeId=SeoraksanSinheungsa', 'open', null, '2026-11-21', '/places/sinheungsa-templestay.webp', '사진: Bernard Gagnon, CC0 (위키미디어 공용)', 'https://commons.wikimedia.org/wiki/File:Sinheungsa_Temple_01.jpg', '설악산을 배경으로 선 신흥사의 단청 누각'),
  ('20000000-0000-4000-8000-000000000219', 'jangsa-fishing-village', '장사어촌체험마을', '체험마을', '장사항에서 공예·배낚시·오징어 체험을 하는 어촌 마을', '강원특별자치도 속초시 장사항해안길 44', 38.226635, 128.588017, 'https://cms.seantour.com/jangsa/index.do', 'https://map.naver.com/p/search/%EC%9E%A5%EC%82%AC%EC%96%B4%EC%B4%8C%EC%B2%B4%ED%97%98%EB%A7%88%EC%9D%84', true, 'experience', array['reservation', 'kids'], '속초 북쪽 장사항 어촌계가 운영하는 어촌체험휴양마을입니다. 가리비 석고 방향제, 바다 키링, 바다 캔버스 같은 공예 체험은 연중 실내에서 할 수 있고, 배낚시(약 3시간)와 파워보트·요트도 연중 예약을 받습니다. 대표 체험인 오징어 맨손잡기는 4~10월에 단체 위주로 열립니다. 바다에 나가는 체험은 날씨 영향을 크게 받습니다.', '공예 체험은 월~금 09:00~16:00, 주말·공휴일은 5명 이상 예약 시 진행. 그 밖의 체험은 프로그램마다 다름', null, '공예 체험 7,000~13,000원 · 오징어 맨손잡기 1인 15,000원 · 파워보트 대인 25,000원 · 배낚시 5인 150,000원', '033-632-9796', '주차 가능', '모든 체험은 전화 예약으로 진행합니다.
오징어 맨손잡기는 4~10월에 50명 이상 단체일 때만 진행하며, 오징어 시세에 따라 체험비가 달라질 수 있습니다.
오징어 순대·요리 만들기는 여름 오징어 맨손잡기 축제 기간(7월 말~8월 초)에만 운영합니다.
바다 체험은 기상과 마을 사정에 따라 바뀔 수 있어 방문 전 가능 여부를 확인해야 합니다.', null, 'open', '오징어 맨손잡기는 4~10월, 스쿠버·스노클링은 8~10월에만 운영합니다.', '2026-11-21', null, null, null, null),
  ('20000000-0000-4000-8000-000000000220', 'yeongrangho-story-bike', '영랑호 스토리자전거', '자전거', '문화해설사와 영랑호 둘레를 도는 자전거 투어', '강원특별자치도 속초시 영랑호반길 140-1', 38.213776, 128.581365, 'https://storybike.kr/', 'https://map.naver.com/p/search/%EC%98%81%EB%9E%91%ED%98%B8%20%EC%8A%A4%ED%86%A0%EB%A6%AC%EC%9E%90%EC%A0%84%EA%B1%B0', true, 'experience', '{}', '사회적기업 (주)영랑체험사업단이 운영하는 자전거 투어로, 문화해설사와 함께 다인승 자전거를 타고 영랑호의 역사와 철새, 범바위 이야기를 들으며 호숫가를 돕니다. 보광사·충혼탑을 지나는 A코스(3km, 약 30분)와 영랑호 둘레길 B코스(8km, 약 40분)가 있습니다. 일반 자전거와 전동 바이크·전동스쿠터 대여도 함께 합니다. 야외 활동이라 비나 강풍, 한파에는 이용이 어렵습니다.', '10:00~18:00(11월은 17:00까지, 12~2월은 16:00까지)', '매주 화요일(방문 전 확인 권장)', '해설사 동행 스토리자전거 4인승 50,000원 · 6인승 70,000원 / 자전거 대여 1인승 1시간 5,000원', '033-637-7009', '사업장에 주차장이 있습니다.', '예약과 단체 문의는 전화(033-637-7009)로 받습니다.
동절기(12~2월)에는 16:00에 운영을 마칩니다.
코스별 요금은 방문 전에 확인하는 것이 좋습니다.', null, 'open', null, '2026-11-21', '/places/yeongrangho-story-bike.webp', '사진: Grapesurgeon, CC BY-SA 4.0 (위키미디어 공용) · 원본에서 잘라냄', 'https://commons.wikimedia.org/wiki/File:%EC%98%81%EB%9E%91%ED%98%B8_01.jpg', '영랑호와 호수 위를 가로지르는 산책 다리'),
  ('20000000-0000-4000-8000-000000000221', 'sports-next-level', '스포츠 넥스트레벨', '체험시설', 'VR·AR로 클라이밍과 스케이트보드를 해 보는 공공 체험관', '강원특별자치도 속초시 척산양지말길 41 척산생활체육관 1층', 38.186450, 128.541643, 'https://nextlevel.sports.or.kr/', 'https://map.naver.com/p/search/%EC%8A%A4%ED%8F%AC%EC%B8%A0%20%EB%84%A5%EC%8A%A4%ED%8A%B8%EB%A0%88%EB%B2%A8', true, 'experience', array['indoor', 'kids', 'reservation'], '속초시설관리공단이 척산생활체육관 1층에서 운영하는 실감형 스포츠 체험관입니다. 한 회차 50분 동안 볼더링, VR 에베레스트, AR 브레이킹, VR 스케이트보드 등 여섯 가지를 차례로 체험합니다. 요금이 저렴하고 실내라 날씨와 상관없지만 회차마다 10명만 받으므로 미리 예약해야 합니다.', '10:00~18:00, 하루 7회(회당 50분, 12~13시 제외)', '매주 수·목요일', '성인 5,000원 · 학생(7~19세) 3,000원 · 미취학(4~6세) 2,000원', '033-637-8760', '척산생활체육관 주차장 무료', '공식 홈페이지에서 회차를 예약한 뒤 이용하며, 회당 정원은 10명입니다.
미취학 아동(4~6세)은 보호자와 함께 들어가야 합니다.
VR 에베레스트는 10세 이상, 키 140cm 이상만 체험할 수 있습니다.
VR 체험 중 멀미로 중단해도 환불되지 않습니다.', 'https://nextlevel.sports.or.kr/reserve', 'open', null, '2026-11-21', null, null, null, null)
on conflict (slug) do nothing;
