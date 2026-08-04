-- Public submissions are accepted only by validated Server Actions. Removing the
-- anonymous Data API path keeps the service-role key on the server and makes that
-- application boundary the single supported visitor write path.
drop policy if exists "Anyone can submit event reports" on public.event_reports;
drop policy if exists "Anyone can submit site feedback" on public.site_feedback;

revoke insert on table public.event_reports from public, anon;
revoke insert on table public.site_feedback from public, anon;

grant insert on table public.event_reports to service_role;
grant insert on table public.site_feedback to service_role;

-- SECURITY DEFINER functions must not resolve objects through a mutable schema.
-- Their bodies already schema-qualify application relations and auth helpers.
alter function public.is_admin() set search_path = '';
alter function public.increment_event_view(text) set search_path = '';
