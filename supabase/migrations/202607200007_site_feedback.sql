create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 200),
  body text not null check (char_length(body) between 10 and 5000),
  link_url text check (link_url is null or char_length(link_url) between 1 and 2048),
  review_status text not null default 'pending' check (review_status in ('pending', 'reviewed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_feedback_review_idx
  on public.site_feedback (review_status, created_at desc);

drop trigger if exists set_site_feedback_updated_at on public.site_feedback;
create trigger set_site_feedback_updated_at before update on public.site_feedback
for each row execute function public.set_updated_at();

alter table public.site_feedback enable row level security;

drop policy if exists "Anyone can submit site feedback" on public.site_feedback;
create policy "Anyone can submit site feedback" on public.site_feedback
for insert to anon, authenticated
with check (review_status = 'pending');

drop policy if exists "Admins manage site feedback" on public.site_feedback;
create policy "Admins manage site feedback" on public.site_feedback
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant insert on public.site_feedback to anon, authenticated;
grant select, update, delete on public.site_feedback to authenticated;

comment on table public.site_feedback is '방문자가 보낸 사이트 사용 의견과 개선 제안. 공개 조회는 막고 운영자만 검토한다.';
