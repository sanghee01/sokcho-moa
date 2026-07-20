-- 상세 페이지 조회를 누적해 목록의 조회순 정렬에 사용한다.
-- 공개 행사만 RPC로 증가할 수 있게 해 직접 update 권한은 노출하지 않는다.
alter table public.events
  add column if not exists view_count integer not null default 0;

alter table public.events
  drop constraint if exists events_view_count_nonnegative;
alter table public.events
  add constraint events_view_count_nonnegative check (view_count >= 0);

create index if not exists events_public_view_count_idx
  on public.events (view_count desc, published_at desc)
  where review_status = 'published';

create or replace function public.increment_event_view(p_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_view_count integer;
begin
  update public.events
  set view_count = view_count + 1
  where slug = p_slug
    and review_status = 'published'
  returning view_count into updated_view_count;

  return updated_view_count;
end;
$$;

revoke all on function public.increment_event_view(text) from public;
grant execute on function public.increment_event_view(text) to anon, authenticated;

comment on column public.events.view_count is '공개 행사 상세 페이지의 누적 조회수. 조회순 목록 정렬에 사용한다.';
