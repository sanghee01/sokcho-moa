do $$
begin
  alter table public.event_reports
    add constraint event_reports_source_url_required check (source_url is not null) not valid;
exception when duplicate_object then null;
end $$;

comment on constraint event_reports_source_url_required on public.event_reports
  is '기존 제보는 유지하되 새 제보부터 출처 링크를 필수로 받는다.';
