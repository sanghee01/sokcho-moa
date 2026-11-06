-- 되돌리기: supabase/migrations/20260804014839_harden_public_submission_boundaries.sql
-- 각 항목을 이 migration 이전 정의로 되돌린다. 역순으로 적었다.
--
-- 데이터 손실 없음. 다만 되돌리면 anon이 Data API로 제보·의견을 직접 insert하는 경로가 다시 열린다
-- (202607200005_event_reports.sql, 202607200007_site_feedback.sql의 상태).
-- service_role의 insert grant는 되돌리지 않는다. 이 migration 이전에도 Supabase 기본 권한으로
-- service_role이 insert 권한을 갖고 있어 이 migration의 grant는 상태를 바꾸지 않았다.

-- 2. SECURITY DEFINER 함수의 search_path 복구(202607190001_initial_schema.sql, 202607200004_event_view_counts.sql)
alter function public.increment_event_view(text) set search_path = public;
alter function public.is_admin() set search_path = public;

-- 1. 방문자 제보·의견 insert 경로 복구
grant insert on table public.event_reports to anon;
grant insert on table public.site_feedback to anon;

drop policy if exists "Anyone can submit site feedback" on public.site_feedback;
create policy "Anyone can submit site feedback" on public.site_feedback
for insert to anon, authenticated
with check (review_status = 'pending');

drop policy if exists "Anyone can submit event reports" on public.event_reports;
create policy "Anyone can submit event reports" on public.event_reports
for insert to anon, authenticated
with check (review_status = 'pending');
