-- 관리자 정책을 작업(select·insert·update·delete)별로 나눈다.
-- Supabase 문서는 `for all` 대신 작업마다 정책을 따로 쓰라고 권한다. 하나의 정책이 모든 작업을 열면, 나중에 grant를
-- 넓혔을 때 의도하지 않은 작업까지 함께 열린다. 작업별로 쓰면 어떤 작업이 열려 있는지 정책만 보고 알 수 있다.
--
-- 권한은 바꾸지 않는다. 조건은 예전과 같은 `(select public.is_admin())`이고, 정책은 authenticated가 grant를 가진 작업에만 만든다
-- (grant가 없는 작업은 정책이 있어도 실행되지 않았다). 행사 삭제처럼 grant가 없는 작업은 security definer RPC가 맡는다.
-- 확인: supabase/tests/database/08_admin_policies_per_command.test.sql

-- events: select, insert, update (삭제는 delete_event_and_exclude RPC)
drop policy "Admins manage events" on public.events;
create policy "Admins read events" on public.events
for select to authenticated using ((select public.is_admin()));
create policy "Admins create events" on public.events
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update events" on public.events
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- event_sources: select, insert, update, delete
drop policy "Admins manage event sources" on public.event_sources;
create policy "Admins read event sources" on public.event_sources
for select to authenticated using ((select public.is_admin()));
create policy "Admins create event sources" on public.event_sources
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update event sources" on public.event_sources
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete event sources" on public.event_sources
for delete to authenticated using ((select public.is_admin()));

-- event_occurrences: select, insert, update, delete
drop policy "Admins manage event occurrences" on public.event_occurrences;
create policy "Admins read event occurrences" on public.event_occurrences
for select to authenticated using ((select public.is_admin()));
create policy "Admins create event occurrences" on public.event_occurrences
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update event occurrences" on public.event_occurrences
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete event occurrences" on public.event_occurrences
for delete to authenticated using ((select public.is_admin()));

-- places: select, insert, update, delete
drop policy "Admins manage places" on public.places;
create policy "Admins read places" on public.places
for select to authenticated using ((select public.is_admin()));
create policy "Admins create places" on public.places
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update places" on public.places
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete places" on public.places
for delete to authenticated using ((select public.is_admin()));

-- event_reports: select, update, delete (방문자 제보 저장은 secret key client가 한다)
drop policy "Admins manage event reports" on public.event_reports;
create policy "Admins read event reports" on public.event_reports
for select to authenticated using ((select public.is_admin()));
create policy "Admins update event reports" on public.event_reports
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete event reports" on public.event_reports
for delete to authenticated using ((select public.is_admin()));

-- site_feedback: select, update, delete (방문자 의견 저장은 secret key client가 한다)
drop policy "Admins manage site feedback" on public.site_feedback;
create policy "Admins read site feedback" on public.site_feedback
for select to authenticated using ((select public.is_admin()));
create policy "Admins update site feedback" on public.site_feedback
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete site feedback" on public.site_feedback
for delete to authenticated using ((select public.is_admin()));

-- 삭제 기록: select만 (쓰기는 삭제·해제 RPC가 한다)
drop policy "Admins manage event deletion tombstones" on public.event_deletion_tombstones;
create policy "Admins read event deletion tombstones" on public.event_deletion_tombstones
for select to authenticated using ((select public.is_admin()));

drop policy "Admins manage event deletion identities" on public.event_deletion_identities;
create policy "Admins read event deletion identities" on public.event_deletion_identities
for select to authenticated using ((select public.is_admin()));
