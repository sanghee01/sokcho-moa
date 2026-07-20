create table if not exists public.event_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 200),
  body text not null check (char_length(body) between 10 and 5000),
  source_url text not null check (char_length(source_url) between 1 and 2048),
  review_status text not null default 'pending' check (review_status in ('pending', 'reviewed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_reports_review_idx
  on public.event_reports (review_status, created_at desc);

drop trigger if exists set_event_reports_updated_at on public.event_reports;
create trigger set_event_reports_updated_at before update on public.event_reports
for each row execute function public.set_updated_at();

alter table public.event_reports enable row level security;

drop policy if exists "Anyone can submit event reports" on public.event_reports;
create policy "Anyone can submit event reports" on public.event_reports
for insert to anon, authenticated
with check (review_status = 'pending');

drop policy if exists "Admins manage event reports" on public.event_reports;
create policy "Admins manage event reports" on public.event_reports
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant insert on public.event_reports to anon, authenticated;
grant select, update, delete on public.event_reports to authenticated;

comment on table public.event_reports is '방문자가 제보한 행사·축제·프로그램 후보. 공개 조회는 막고 운영자만 검토한다.';
