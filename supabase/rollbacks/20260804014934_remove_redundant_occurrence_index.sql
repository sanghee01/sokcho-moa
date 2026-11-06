-- 되돌리기: supabase/migrations/20260804014934_remove_redundant_occurrence_index.sql
-- 지운 회차 index를 202607200001_event_occurrences.sql과 같은 정의로 다시 만든다.
--
-- 데이터 손실 없음. index 생성 동안 event_occurrences 쓰기가 잠긴다(행 수가 적어 짧다).

create index if not exists event_occurrences_event_start_idx
  on public.event_occurrences (event_id, starts_at);
