-- 명소(places)를 상시 즐길거리 목록·상세 페이지에 쓰도록 넓히고, 공지(notices) 테이블을 추가한다(2026-11-21 사용자 결정).
-- 새 테이블을 따로 만들지 않고 places를 넓힌 이유: 즐길거리 후보 가운데 37곳이 이미 places에 있어,
-- 테이블을 나누면 같은 장소가 두 곳에 생긴다.

-- 1. places: 즐길거리로 보여 줄 때 필요한 값.
--    activity_category가 null인 행은 지금처럼 행사 상세의 "주변 명소"에만 나오고 즐길거리 목록에는 나오지 않는다.
--    행사와 달리 끝나는 날이 없어 정보가 조용히 낡으므로, 확인한 날(verified_on)과 운영 상태를 함께 둔다.
alter table public.places
  add column activity_category text
    check (activity_category in ('water', 'exhibition', 'view', 'themepark', 'marine', 'experience', 'nature')),
  add column tags text[] not null default '{}'
    check (tags <@ array['indoor', 'kids', 'free', 'reservation']::text[]),
  add column description text,
  add column hours_summary text,
  add column closed_summary text,
  add column price_summary text,
  add column phone text,
  add column parking_summary text,
  -- 유의사항. 한 줄에 하나씩 적는다.
  add column cautions text,
  add column booking_url text,
  add column operation_status text not null default 'open'
    check (operation_status in ('open', 'seasonal_closed', 'temporarily_closed', 'closed')),
  add column status_note text,
  add column verified_on date;

-- 2. notices: 공지와 업데이트(패치노트). 관리자 화면에서 쓰고, 공개한 글만 방문자가 읽는다.
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'notice' check (kind in ('notice', 'update')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  is_published boolean not null default false,
  -- 처음 공개한 때. 상단 배너를 며칠 동안 띄울지와 목록 순서의 기준이다.
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_published_at_required check (not is_published or published_at is not null)
);

create index notices_public_idx on public.notices (published_at desc) where is_published;

create trigger set_notices_updated_at before update on public.notices
for each row execute function public.set_updated_at();

alter table public.notices enable row level security;

create policy "Published notices are public" on public.notices
for select to anon, authenticated
using (is_published = true);

create policy "Admins read notices" on public.notices
for select to authenticated using ((select public.is_admin()));
create policy "Admins create notices" on public.notices
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update notices" on public.notices
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete notices" on public.notices
for delete to authenticated using ((select public.is_admin()));

-- Supabase는 새 table에 anon·authenticated의 모든 권한을 기본으로 준다. 쓰는 것만 남긴다.
revoke all on table public.notices from anon, authenticated;
grant select on table public.notices to anon, authenticated;
grant insert, update, delete on table public.notices to authenticated;
