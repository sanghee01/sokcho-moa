-- 되돌리기: supabase/migrations/20261106132943_split_admin_policies_per_command.sql
-- 작업별 관리자 정책을 지우고 예전의 `for all` 정책으로 되돌린다. 데이터는 바꾸지 않으므로 백업할 것이 없다.

drop policy "Admins read event deletion identities" on public.event_deletion_identities;
create policy "Admins manage event deletion identities" on public.event_deletion_identities
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy "Admins read event deletion tombstones" on public.event_deletion_tombstones;
create policy "Admins manage event deletion tombstones" on public.event_deletion_tombstones
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy "Admins read site feedback" on public.site_feedback;
drop policy "Admins update site feedback" on public.site_feedback;
drop policy "Admins delete site feedback" on public.site_feedback;
create policy "Admins manage site feedback" on public.site_feedback
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy "Admins read event reports" on public.event_reports;
drop policy "Admins update event reports" on public.event_reports;
drop policy "Admins delete event reports" on public.event_reports;
create policy "Admins manage event reports" on public.event_reports
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy "Admins read places" on public.places;
drop policy "Admins create places" on public.places;
drop policy "Admins update places" on public.places;
drop policy "Admins delete places" on public.places;
create policy "Admins manage places" on public.places
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy "Admins read event occurrences" on public.event_occurrences;
drop policy "Admins create event occurrences" on public.event_occurrences;
drop policy "Admins update event occurrences" on public.event_occurrences;
drop policy "Admins delete event occurrences" on public.event_occurrences;
create policy "Admins manage event occurrences" on public.event_occurrences
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy "Admins read event sources" on public.event_sources;
drop policy "Admins create event sources" on public.event_sources;
drop policy "Admins update event sources" on public.event_sources;
drop policy "Admins delete event sources" on public.event_sources;
create policy "Admins manage event sources" on public.event_sources
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy "Admins read events" on public.events;
drop policy "Admins create events" on public.events;
drop policy "Admins update events" on public.events;
create policy "Admins manage events" on public.events
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
