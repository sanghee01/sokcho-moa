-- 되돌리기: supabase/migrations/20261121143230_add_seorak_place_photos.sql
-- 사진 비우기: 이 migration이 넣은 사진 그대로일 때만 비운다.
update public.places set image_url = null, image_credit = null, image_source_url = null, image_alt = null
where slug = 'geumganggul-cave' and image_url = '/places/geumganggul-cave.webp';
update public.places set image_url = null, image_credit = null, image_source_url = null, image_alt = null
where slug = 'heundeulbawi' and image_url = '/places/heundeulbawi.webp';
update public.places set image_url = null, image_credit = null, image_source_url = null, image_alt = null
where slug = 'towangseong-falls-observatory' and image_url = '/places/towangseong-falls-observatory.webp';
