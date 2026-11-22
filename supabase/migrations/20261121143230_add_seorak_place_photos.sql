-- 설악산 장소 3곳(금강굴·흔들바위·토왕성폭포 전망대)에 위키미디어 공용 공개 라이선스(CC BY-SA 3.0) 사진을 넣는다(2026-11-21 사용자 요청).
-- 사진 파일은 public/places/<slug>.webp와 -thumb.webp로 함께 배포한다.
update public.places set image_url = '/places/geumganggul-cave.webp', image_credit = '사진: Sohyeon Bak, CC BY-SA 3.0 (위키미디어 공용) · 원본에서 잘라냄', image_source_url = 'https://commons.wikimedia.org/wiki/File:%EA%B8%88%EA%B0%95%EA%B5%B4.jpg', image_alt = '깎아지른 바위 절벽을 따라 금강굴로 오르는 철계단'
where slug = 'geumganggul-cave' and image_url is null;
update public.places set image_url = '/places/heundeulbawi.webp', image_credit = '사진: Steve46814, CC BY-SA 3.0 (위키미디어 공용) · 원본에서 잘라냄', image_source_url = 'https://commons.wikimedia.org/wiki/File:Korea-Seoraksan-Kyejoam-Heundeulbawi-01.jpg', image_alt = '계조암 앞 너른 바위 위에 얹힌 흔들바위를 한 사람이 밀고 있는 모습'
where slug = 'heundeulbawi' and image_url is null;
update public.places set image_url = '/places/towangseong-falls-observatory.webp', image_credit = '사진: Camangbarry, CC BY-SA 3.0 (위키미디어 공용) · 원본에서 잘라냄', image_source_url = 'https://commons.wikimedia.org/wiki/File:%ED%86%A0%EC%99%95%EC%84%B1_%ED%8F%AD%ED%8F%AC.jpg', image_alt = '바위 절벽을 따라 길게 떨어지는 토왕성폭포'
where slug = 'towangseong-falls-observatory' and image_url is null;
