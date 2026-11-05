# 데이터베이스 상세

> **상태: AI 분석 초안(2026-11-05, `main` 85e8b44 기준).** migration SQL과 코드를 정적으로 읽어 정리했습니다.
> DB·Supabase CLI는 실행하지 않았으므로, 운영 DB의 실제 상태와 다를 수 있습니다. "추측"으로 표시한 항목은
> 운영 DB나 로컬 DB에서 확인이 필요합니다. 요약은 [architecture.md](architecture.md#테이블과-권한-요약)를 먼저 봅니다.

## 1차 리팩토링 이후 바뀐 것(2026-11-05)

- 새 migration `20261105090000_cleanup_unused_objects.sql`(rollback 포함): `replace_event_occurrences` RPC 삭제, 중복 index 2개 삭제,
  authenticated의 제보·의견 insert 권한 회수, 운영 DB의 `event_reports.source_url`을 not null로 맞춤. 로컬에서 전체 재적용 성공, 운영 적용은 사용자.
- 운영 대시보드 확인: `event_reports.source_url`이 실제로 nullable(아래 A-1의 추측이 맞음), Postgres 17.6, 원격 migration 이력은 `20260803015356` 이후 7개.
- pgTAP(`supabase/tests/database/`)으로 확인: Supabase가 table 권한을 기본으로 넓게 주므로 anon의 select·update는 권한 오류가 아니라 RLS 때문에 0행이 된다.
  insert는 migration이 grant를 회수해 권한 오류가 난다. 아래 3절 "기본권한?" 표시는 이 결과로 "기본 권한 있음"으로 읽으면 된다.
- `lib/supabase/database.types.ts`를 로컬 DB에서 생성한다(`pnpm db:types`).

## 파일 약어

아래 `파일:라인` 인용은 이 약어를 씁니다. 모두 `supabase/migrations/` 안의 파일입니다.

| 약어 | 파일 (`supabase/migrations/`) |
|---|---|
| M01 | 202607190001_initial_schema.sql |
| M02 | 202607190002_event_location_evidence.sql |
| M03 | 202607190003_verified_event_locations.sql |
| M04 | 202607200001_event_occurrences.sql |
| M05 | 202607200002_backfill_event_occurrences.sql |
| M06 | 202607200003_expand_places.sql |
| M07 | 202607200004_event_view_counts.sql |
| M08 | 202607200005_event_reports.sql |
| M09 | 202607200006_require_event_report_url.sql |
| M10 | 202607200007_site_feedback.sql |
| M11 | 202607200008_feedback_images.sql |
| M12 | 202607280001_event_search_metadata.sql |
| M13 | 202607290001_merge_event_introductions.sql |
| M14 | 20260803015356_prevent_deleted_event_recollection.sql |
| M15 | 20260804014839_harden_public_submission_boundaries.sql |
| M16 | 20260804014903_atomic_event_updates.sql |
| M17 | 20260804014934_remove_redundant_occurrence_index.sql |
| M18 | 20260804020600_public_submission_rate_limits.sql |
| M19 | 20260804020609_limit_feedback_image_size.sql |
| M20 | 20260804023022_limit_event_image_size.sql |
| RB | `supabase/rollbacks/20260720_event_occurrences.sql` |

---

## Migration별 요약

rollback 파일은 RB 하나뿐이고 M04+M05만 대상으로 한다(RB:1). 나머지는 SQL 주석으로 된 수동 되돌리기 안내(M05:122-124)이거나 아예 없다.

| 파일 | 무엇을 바꿨나 | 종류 | rollback 파일? | 되돌리기 어려운 점 |
|---|---|---|---|---|
| M01 | enum 2개, `admin_users`·`events`·`places`·`event_sources` 테이블, `set_updated_at`·`is_admin()`, 전 테이블 RLS와 정책, `event-images` 공개 버킷과 storage 정책을 만든다. | 테이블/인덱스/RLS/함수/트리거/스토리지 | 없음 | 초기 스키마다. 되돌리면 전체 데이터가 사라진다. |
| M02 | `events`에 위치 근거 컬럼 2개(`location_source_url`, `location_verified_at`)를 추가하고, 좌표 쌍·근거 쌍·URL 형식 check를 건다. | 컬럼/제약 | 없음 | 컬럼을 drop하면 근거 데이터가 사라진다. |
| M03 | 운영 행사 18건의 좌표·주소·근거 URL, 1건의 source_url, 20건의 `last_verified_at`과 `event_sources.last_checked_at`을 하드코딩 UUID로 덮어쓴다. 검증 DO 블록이 있고 파일 안에 `begin;…commit;`(M03:4, 277)이 있다. | 데이터 backfill | 없음 | 이전 좌표·주소·URL 값이 보존되지 않아 덮어쓴 값은 복구할 수 없다. 2026-08-04 커밋 673ff45에서 이미 적용된 파일을 수정했다(빈 DB 검증 허용). |
| M04 | `events.schedule_mode`(continuous/occurrences)와 `event_occurrences` 테이블, RLS, `replace_event_occurrences` RPC(security invoker)를 추가한다. | 컬럼/테이블/인덱스/RLS/함수 | RB | RB는 뒤 마이그레이션(M14, M16)이 이 테이블과 컬럼에 의존하므로 지금은 그대로 쓸 수 없다([확인이 필요한 지점](#확인이-필요한-지점) 참고). |
| M05 | 4개 행사의 기존 회차를 지우고 공식 회차 29건을 넣은 뒤 `schedule_mode='occurrences'`로 바꾼다. | 데이터 backfill(삭제 포함) | RB(+M05:122-124 주석) | 해당 4개 행사의 이전 회차를 먼저 delete한다(M05:35-41). 이전 값은 snapshot이 있어야 복구할 수 있다. |
| M06 | 생성 스크립트 출력으로 명소 122곳을 `places`에 upsert한다(`on conflict (slug) do update`, M06:129-140). | 데이터 backfill | 없음 | 같은 slug의 관리자 수정값을 덮어쓴다. seed.sql:8-133에도 같은 데이터가 중복으로 있다. |
| M07 | `events.view_count`, 0 이상 check, 조회순 부분 인덱스, `increment_event_view` RPC(SECURITY DEFINER)를 추가한다. | 컬럼/인덱스/함수 | 없음 | 컬럼을 drop하면 누적 조회수가 사라진다. |
| M08 | `event_reports` 테이블, updated_at 트리거, RLS(누구나 insert, 관리자 전체 권한), grant를 추가한다. | 테이블/인덱스/RLS/트리거 | 없음 | 커밋 4146fba에서 이미 적용된 파일의 `source_url`을 nullable에서 `not null`로 수정했다([확인이 필요한 지점](#확인이-필요한-지점)). |
| M09 | `event_reports`에 `source_url is not null` check를 `NOT VALID`로 추가한다. | 제약 | 없음 | 위험은 낮다. 다만 새 DB에서는 M08이 이미 `not null`이라 중복이다([확인이 필요한 지점](#확인이-필요한-지점)). |
| M10 | `site_feedback` 테이블, 트리거, RLS(누구나 insert, 관리자 전체 권한), grant를 추가한다. | 테이블/인덱스/RLS/트리거 | 없음 | 해당 없음 |
| M11 | `site_feedback.image_path`, 비공개 `feedback-images` 버킷(4MB), 관리자 select/delete storage 정책을 추가한다. | 컬럼/스토리지/RLS | 없음 | 버킷을 지우면 첨부가 사라진다. |
| M12 | `performer_people`·`performer_groups`(text[])·`organizer_url`과 빈 문자열·50개 이하 check를 추가한다. | 컬럼/제약 | 없음 | drop하면 데이터가 사라진다. |
| M13 | `summary`가 비어 있고 `description`만 있는 행은 `summary := description`으로 채운다. | 데이터 backfill | 없음 | 어떤 행이 바뀌었는지 기록하지 않아 정확히 되돌릴 수 없다. |
| M14 (1462줄) | 삭제 tombstone·identity 테이블 2개, URL 정규화·identity 함수 9개, advisory-lock 직렬화 트리거, 재수집 차단 트리거 3개, RPC 3개(`delete_event_and_exclude`·`release_event_collection_exclusion`·`create_event_with_source`)를 추가한다. `events`의 DELETE grant를 anon·authenticated·service_role 모두에서 회수한다. | 테이블/인덱스/RLS/함수·RPC/트리거/grant | 없음 | 이후 삭제 감사 데이터가 쌓인다. 되돌리면 삭제 행사 재수집 차단과 감사 기록이 사라진다. grant 회수를 되돌리는 SQL도 없다. |
| M15 | `event_reports`·`site_feedback`의 공개 insert 정책과 anon insert grant를 제거하고 service_role에 insert를 grant한다. `is_admin`·`increment_event_view`의 `search_path`를 `''`로 바꾼다. | RLS/grant/함수 설정 | 없음 | 해당 없음 (권한만 변경) |
| M16 | 관리자 수정용 원자 RPC `update_event_with_source`(SECURITY DEFINER)를 추가한다. | 함수·RPC | 없음 | 해당 없음 |
| M17 | `event_occurrences_event_start_idx`를 drop한다. unique 제약 인덱스와 중복이기 때문이다. | 인덱스 | 없음 | 해당 없음 |
| M18 | `private` 스키마, `private.public_submission_rate_limits`, `consume_public_submission_rate_limit` RPC(SECURITY DEFINER, service_role 전용)를 추가한다. | 스키마/테이블/인덱스/RLS/함수 | 없음 | 해당 없음 (카운터는 휘발성 성격) |
| M19 | `feedback-images` 파일 크기 한도를 4MB에서 3MB로 줄인다. | 스토리지 설정 | 없음 | 이미 올라간 3MB 초과 파일에는 영향이 없다. |
| M20 | `event-images` 파일 크기 한도를 5MB에서 3MB로 줄인다. | 스토리지 설정 | 없음 | M19와 같다. |

seed.sql: 명소 122곳 upsert(M06과 동일, seed.sql:8-140), 데모 행사 8건(`is_demo` 샘플, seed.sql:146-160), 데모 1건 회차 2개(seed.sql:162-172), 데모 출처(seed.sql:174-178). `now()` 기준 상대 날짜를 쓴다.

---

## 최종 schema

모든 migration을 적용한 뒤의 상태입니다.

### enum
- `public.event_category`: performance, festival, experience, education, exhibition, other (M01:3-6)
- `public.event_review_status`: pending, published, rejected (M01:8-11)

### public.admin_users (M01:13-17)
- 컬럼: `user_id uuid` PK, FK → `auth.users(id) on delete cascade`; `email text not null unique`; `created_at`
- 정책은 없고 RLS만 켜져 있다(M01:136). `is_admin()` 안에서만 읽힌다.

### public.events
- 컬럼(M01:19-51): `id uuid` PK, `slug` unique+형식 check, `title`(1~200자), `summary`, `description`(레거시. M16 수정 RPC는 쓰지 않음), `category` enum, `audiences text[]`, `event_start_at`, `event_end_at`, `operating_hours`, `application_start_at`, `application_end_at`, `location_name`, `address`, `latitude`/`longitude numeric(9,6)`, `price_text`, `is_free`, `organizer`, `contact`, `official_url`, `application_url`, `image_url`, `source_name not null`, `source_url not null`, `review_status`(기본 pending), `is_featured`, `is_demo`, `last_verified_at`, `published_at`, `created_at`, `updated_at`
  - M02:1-3: `location_source_url`, `location_verified_at`
  - M04:2-3: `schedule_mode text not null default 'continuous'`
  - M07:3-4: `view_count integer not null default 0`
  - M12:1-4: `performer_people text[]`, `performer_groups text[]`, `organizer_url`
- check:
  - `events_time_order`, `events_application_order`, `events_latitude`, `events_longitude`, `events_audiences`(child/youth/family/adult/all), `events_published_fields`(published면 `published_at`과 `event_start_at` 필수) (M01:52-61)
  - `events_coordinates_pair`, `events_location_evidence_pair`, `events_location_source_url_format` (M02:5-24)
  - `events_schedule_mode_check` (M04:7-9)
  - `events_view_count_nonnegative` (M07:8-9)
  - `events_performer_people_nonempty`, `events_performer_groups_nonempty` (M12:6-12)
- 인덱스:
  - PK, slug unique
  - `events_public_date_idx(event_start_at, event_end_at) where published` (M01:93-94)
  - `events_application_idx(application_end_at) where published` (M01:95-96)
  - `events_category_idx` (M01:97)
  - `events_audiences_gin_idx` GIN (M01:98)
  - `events_public_view_count_idx(view_count desc, published_at desc) where published` (M07:11-13)
- 트리거:
  - `set_events_updated_at`: BEFORE UPDATE row, 컬럼 제한 없음 (M01:113-115)
  - `serialize_event_collection_mutations`: BEFORE INSERT/DELETE/UPDATE OF 〈view_count를 뺀 컬럼〉 statement (M14:1315-1357)
  - `prevent_deleted_event_recollection`: BEFORE INSERT/UPDATE OF slug, source_url row (M14:1369-1372)
  - `prevent_deleted_event_publish`: BEFORE UPDATE OF review_status, published로 바뀔 때만 (M14:1374-1382)

### public.places (M01:64-79)
- 컬럼: `id` PK, `slug` unique+형식, `name`(1~200), `category`, `summary`, `address`, `latitude`/`longitude not null`+범위 check, `image_url`, `official_url`, `map_url`, `is_published`(기본 false), `created_at`, `updated_at`
- 인덱스: `places_public_idx(is_published, name)` (M01:99)
- 트리거: `set_places_updated_at` (M01:117-119)
- 데이터: M06이 122곳을 upsert한다.

### public.event_sources (M01:81-91)
- 컬럼: `id` PK; `event_id` FK → events `on delete cascade`; `provider`, `original_url`(not null); `external_id`; `collected_at`; `last_checked_at`; `created_at`
- unique `(event_id, provider, original_url)` (M01:90)
- 인덱스: `event_sources_event_idx(event_id)` (M01:100). unique 인덱스의 선두 컬럼과 겹친다([확인이 필요한 지점](#확인이-필요한-지점)).
- 트리거: `serialize_event_source_collection_mutations` statement (M14:1359-1362), `prevent_deleted_event_source_recollection` row (M14:1384-1387). updated_at 트리거는 없다.

### public.event_occurrences (M04:11-19)
- 컬럼: `id` PK; `event_id` FK → events `on delete cascade`; `starts_at not null`; `ends_at`; `created_at`
- check: `event_occurrences_time_order`
- unique: `event_occurrences_unique_start (event_id, starts_at)`
- 인덱스: unique 인덱스만 남는다. `event_occurrences_event_start_idx`(M04:21-22)는 M17:3에서 삭제했다.
- 트리거: `serialize_event_occurrence_collection_mutations` statement (M14:1364-1367)

### public.event_reports (M08:1-9)
- 컬럼: `id` PK, `title`(2~200), `body`(10~5000), `source_url text not null`(1~2048), `review_status text`(pending/reviewed/rejected), `created_at`, `updated_at`
- 추가 제약: `event_reports_source_url_required` NOT VALID (M09:1-6)
- 인덱스: `event_reports_review_idx(review_status, created_at desc)` (M08:11-12)
- 트리거: `set_event_reports_updated_at` (M08:14-16)

### public.site_feedback (M10:1-9, M11:1-3)
- 컬럼: `id` PK, `title`(2~200), `body`(10~5000), `link_url`(null 또는 1~2048), `review_status`(pending/reviewed/rejected), `created_at`, `updated_at`, `image_path`(null 또는 1~500)
- 인덱스: `site_feedback_review_idx(review_status, created_at desc)` (M10:11-12)
- 트리거: `set_site_feedback_updated_at` (M10:14-16)

### public.event_deletion_tombstones (M14:4-25)
- 컬럼: `id` PK, `original_event_id`(FK 없음), `original_title`, `original_slug`, `event_snapshot jsonb`, `deleted_by uuid`(의도적으로 FK 없음, M14:1427-1428), `deleted_at`, `reason`, `released_at`, `released_by`
- check: slug·title 공백 금지, snapshot이 object, reason 공백 금지, `(released_at is null) = (released_by is null)`
- 인덱스: `…_deleted_at_idx(deleted_at desc)`, `…_original_event_id_idx`, `…_slug_idx`, `…_active_deleted_at_idx(deleted_at desc) where released_at is null` (M14:47-55)

### public.event_deletion_identities (M14:27-45)
- 컬럼: `id` PK; `tombstone_id` FK → tombstones `on delete cascade`; `identity_key`(sha256 기반); `kind`(slug/url/external_id); `source_namespace`; `identity_value`; `source_url`; `created_at`
- unique: `(tombstone_id, identity_key)`
- 인덱스: `…_tombstone_id_idx(tombstone_id)`(unique 선두와 중복), `…_identity_key_idx(identity_key)` (M14:56-59)

### private.public_submission_rate_limits (M18:8-24)
- PK: `(scope, key_hash)`
- check: scope ∈ {event_report, site_feedback}, key_hash 64자 hex, `window_ends_at > window_started_at`, `request_count > 0`
- 인덱스: `public_submission_rate_limits_expiry_idx(window_ends_at)` (M18:26-27)

### storage.buckets
- `event-images`: public=true, mime jpeg/png/webp. 크기 한도는 5MB(M01:179-184)였고 M20:3-5에서 3MB가 됐다.
- `feedback-images`: public=false, mime 동일. 크기 한도는 4MB(M11:5-10)였고 M19:3-5에서 3MB가 됐다.

### 함수 목록 (최종)
`set_updated_at`, `is_admin`, `replace_event_occurrences`, `increment_event_view`, M14의 함수 17개(헬퍼 10개: URL·identity 9개 + `is_event_collection_excluded` / 트리거 함수 4개 / RPC 3개), `update_event_with_source`, `consume_public_submission_rate_limit`. 권한은 [권한](#권한) 절에 정리했다.

---

## 권한

### 읽기 전 전제
- **service_role**은 Supabase에서 `BYPASSRLS` 속성을 가진다. RLS는 무시하지만 테이블·함수 GRANT는 여전히 필요하다.
- 마이그레이션 SQL에 명시된 grant/revoke만 근거로 삼았다. Supabase 프로젝트의 기본 권한 설정은 마이그레이션에 없다. `ALTER DEFAULT PRIVILEGES … GRANT ALL TO anon, authenticated, service_role`가 켜져 있는지는 확인할 수 없다(추측 영역). 표의 "기본권한?" 표시는 "명시 grant는 없으며, 가능 여부는 Supabase 기본 권한이 켜져 있는지에 달려 있음"이라는 뜻이다. M14:78-79의 주석("Raw SQL migrations can inherit broad Data API defaults")으로 보아, 작성자는 기본 권한이 켜져 있다고 가정한 것으로 보인다.
- 표 기호: ✓ = 가능, ✗ = 불가, admin = `is_admin()`이 참인 authenticated만 가능

### 테이블

| 대상 | RLS | anon S/I/U/D | authenticated S/I/U/D | service_role S/I/U/D | 근거 |
|---|---|---|---|---|---|
| `events` | on (M01:137) | S: published만 / I ✗ / U ✗ / D ✗ | S: published 또는 admin 전체 / I admin / U admin / **D ✗(admin도 불가)** | S·I·U 기본권한? / **D ✗** | 정책 "Published events are public"(M01:141-144), "Admins manage events"(M01:146-150). grant select anon,auth(M01:176), grant I/U/D auth(M01:177). **`revoke delete … from anon, authenticated, service_role`(M14:88)**. 삭제는 `delete_event_and_exclude`로만 한다. |
| `places` | on (M01:138) | S: `is_published`만 / I·U·D ✗ | S published 또는 admin / I·U·D admin | 기본권한? | "Published places are public"(M01:152-155), "Admins manage places"(M01:157-161), grant(M01:176-177) |
| `event_sources` | on (M01:139) | S: 부모가 published일 때 / I·U·D ✗ | S 위와 같음 또는 admin / I·U·D admin | 기본권한? | "Sources of published events are public"(M01:163-168), "Admins manage event sources"(M01:170-174), grant(M01:176-177) |
| `event_occurrences` | on (M04:24) | S: 부모가 published일 때 / I·U·D ✗ | S 위와 같음 또는 admin / I·U·D admin | 기본권한? | "Occurrences of published events are public"(M04:26-34), "Admins manage event occurrences"(M04:36-40), grant(M04:42-43) |
| `admin_users` | on (M01:136) | 전부 ✗ (정책 없음) | 전부 ✗ (정책 없음) | 기본권한? (RLS 우회) | 정책·명시 grant 없음. `is_admin()`(SECURITY DEFINER) 안에서만 조회한다(M01:121-131). |
| `event_reports` | on (M08:18) | 전부 ✗ | S/I/U/D admin (insert grant가 남아 있어 admin은 insert도 가능) | **I ✓**(명시) / S·U·D 기본권한? | 공개 insert 정책을 M15:4에서 삭제했다. `revoke insert from public, anon`(M15:7, authenticated는 회수하지 않음). grant insert anon,auth(M08:31), grant S/U/D auth(M08:32), "Admins manage event reports"(M08:25-29), `grant insert to service_role`(M15:10) |
| `site_feedback` | on (M10:18) | 전부 ✗ | S/I/U/D admin | **I ✓**(명시) / S·U·D 기본권한? | M15:5, M15:8, M10:31-32, "Admins manage site feedback"(M10:25-29), M15:11 |
| `event_deletion_tombstones` | on (M14:61) | ✗ | **S admin만** / I·U·D ✗(grant 없음) | **전부 ✗**(revoke) | "Admins manage event deletion tombstones"(M14:64-69, for all). `revoke all … from public, anon, authenticated, service_role`(M14:81), `grant select to authenticated`(M14:83). 쓰기는 DEFINER RPC로만 한다. |
| `event_deletion_identities` | on (M14:62) | ✗ | S admin만 / I·U·D ✗ | 전부 ✗ | 정책(M14:71-76), revoke(M14:82), grant select(M14:84) |
| `private.public_submission_rate_limits` | on (M18:29), 정책 없음 | ✗ | ✗ | ✗ | `revoke all on schema private …`(M18:6), `revoke all on table … from public, anon, authenticated, service_role`(M18:30-31). DEFINER RPC 소유자만 접근한다. |

뷰: 마이그레이션 안에 `create view`는 없다.

### Storage (`storage.objects` 정책)

| 버킷 | 공개 | anon | authenticated | service_role | 근거 |
|---|---|---|---|---|---|
| `event-images` | public=true (공개 URL은 RLS와 무관하게 읽힘) | S ✓(목록 API 포함) / I·U·D ✗ | S ✓ / I·U·D admin | RLS 우회 | "Event images are public"(M01:186-189), "Admins upload event images"(M01:191-194), "Admins update event images"(M01:196-200), "Admins delete event images"(M01:202-205) |
| `feedback-images` | public=false | 전부 ✗ | S admin(signed URL) / D admin / **I·U ✗(정책 없음)** | 업로드는 service_role만 가능(RLS 우회) | "Admins read feedback images"(M11:12-15), "Admins delete feedback images"(M11:17-20) |

### 함수·RPC

| 함수 | SECURITY | search_path | 실행 권한 (anon / authenticated / service_role) | 내부 권한 검사 | 근거 |
|---|---|---|---|---|---|
| `set_updated_at()` (트리거) | invoker | `public` (M01:105) | 명시 없음 | 해당 없음 | M01:102-111 |
| `is_admin()` | **DEFINER** (M01:125) | `public`이었다가 **`''`**로 바뀜 (M15:15) | ✓ / ✓ / 기본권한? | 해당 없음 | `revoke all from public`, `grant execute to anon, authenticated`(M01:133-134) |
| `replace_event_occurrences(uuid,jsonb)` | invoker (M04:52) | `public` (M04:53, 고정 안 됨) | 기본권한? / ✓ / 기본권한? | `is_admin()` (M04:56-58) | M04:74-75. 앱에서 쓰지 않는다. |
| `increment_event_view(text)` | **DEFINER** (M07:18) | `public`이었다가 **`''`**로 바뀜 (M15:16) | ✓ / ✓ / 기본권한? | 없음. published 행만 update한다(M07:27). | M07:34-35 |
| URL·identity 헬퍼 9개: `decode_event_url_component`, `canonicalize_event_url_path`, `normalize_event_source_url`, `extract_event_source_external_id`, `event_source_namespace`, `event_source_global_namespace`, `event_deletion_identity_key`, `event_deletion_identity_keys`, `lock_event_deletion_identity_keys` | invoker (M14:101, 151, 200, 293, 370, 483, 541, 571, 667) | `''` | ✗ / ✓ / **✗** | 없음 (순수 함수 또는 advisory lock) | revoke(M14:1391-1399), grant authenticated(M14:1409-1417) |
| `is_event_collection_excluded(text,text,text)` | invoker (M14:714) | `''` | ✗ / ✓ / ✗ | 없음. invoker라 non-admin은 RLS 때문에 항상 false를 받는다. | M14:705-726, 1401, 1418 |
| `serialize_event_collection_mutations()` (트리거) | **DEFINER** (M14:694) | `''` | ✗ / ✗ / ✗ (트리거로만 실행) | 해당 없음 | M14:690-703, 1400 |
| `delete_event_and_exclude(uuid,text)` | **DEFINER** (M14:736) | `''` | ✗ / ✓ / ✗ | `is_admin()` (M14:745-748) | M14:1402, 1419 |
| `release_event_collection_exclusion(uuid)` | **DEFINER** (M14:890) | `''` | ✗ / ✓ / ✗ | `is_admin()` (M14:897-900) | M14:1403, 1420 |
| `create_event_with_source(jsonb,jsonb,timestamptz)` | **DEFINER** (M14:946) | `''` | ✗ / ✓ / ✗ | `is_admin()` (M14:954-957). 허용 필드 allow-list(M14:968-1008). `review_status='pending'`, `is_demo=false`로 고정(M14:1148-1150). | M14:1404, 1421 |
| `reject_tombstoned_event_insert()` / `_event_source_insert()` / `_event_publish()` (트리거) | **DEFINER** (M14:1186, 1215, 1247) | `''` | 전부 ✗ (트리거로만 실행) | `role='authenticated'`이고 admin이 아니면 그대로 통과시켜 RLS가 거부하게 한다(M14:1192-1196 등). | M14:1405-1407 |
| `update_event_with_source(uuid,jsonb,jsonb,timestamptz)` | **DEFINER** (M16:12) | `''` | ✗ / ✓ / ✗ | `is_admin()` (M16:22-25). allow-list(M16:42-76). occurrence 키 검증(M16:78-87). schedule_mode와 회차 수 일치 검증(M16:136-144). | M16:258-261 |
| `consume_public_submission_rate_limit(text,text,int,int)` | **DEFINER** (M18:42) | `''` | ✗ / ✗ / **✓** | 인자 범위만 검증한다. 호출자 검사는 grant에 의존한다. | M18:126-129 |

---

## 앱 사용처

### 클라이언트 종류
| 파일 | 생성 함수 | 역할 |
|---|---|---|
| `lib/supabase/server.ts:5-11` | `createPublicSupabaseClient` | supabase-js + publishable key, 세션 없음. 항상 **anon**. |
| `lib/supabase/auth-server.ts:6-25` | `createAuthenticatedSupabaseClient` | `@supabase/ssr` + publishable key + 쿠키 세션. 로그인 상태면 **authenticated**, 아니면 anon. |
| `lib/supabase/service.ts:11-19` | `createServiceRoleSupabaseClient` | `SUPABASE_SERVICE_ROLE_KEY`, server-only. **service_role**. |
| `lib/supabase/browser.ts:5-12` | `createSupabaseBrowserClient` | publishable key 브라우저 클라이언트. **app/lib/components 어디서도 import하지 않는다(미사용).** |
| `proxy.ts:26` | `createServerClient` | 세션 쿠키 갱신용 |

### 테이블
| 대상 | 위치 | 동작 | client |
|---|---|---|---|
| events | `lib/data/events.ts:14-19` (+`:21-26` fallback) | 공개 목록. published이고 `is_demo=false`인 행, `event_occurrences` embed | anon (server.ts) |
| events | `lib/admin/queries.ts:43-47`, `:62-64`, `:77-79`, `:83` | 관리자 목록·상태별 개수·단건(+occurrences embed) | authenticated |
| events | `lib/actions/admin/event.ts:171-175`, `:239-243`, `:298-302` | 저장·삭제 전후 상태 select | authenticated |
| events | `lib/actions/admin/event.ts:267-276` | **직접 update**: `review_status`, `published_at` | authenticated (정책 "Admins manage events") |
| places | `lib/data/events.ts:41` | 공개 명소 | anon |
| places | `lib/admin/queries.ts:93`, `:101` | 관리자 조회 | authenticated |
| places | `lib/actions/admin/place.ts:75`(update), `:76`(insert), `:97`(delete) | 관리자 CRUD | authenticated |
| event_occurrences | `lib/data/events.ts:16`, `lib/admin/queries.ts:79` | embed 조회만 한다. 쓰기는 RPC로 한다. | anon / authenticated |
| event_sources | 직접 호출 없음 | create/update RPC와 cascade로만 변경된다. | 해당 없음 |
| event_reports | `lib/actions/reports.ts:58` | 방문자 제보 insert (rate-limit 이후) | **service_role** (`:53`) |
| event_reports | `lib/admin/queries.ts:109-112`, `lib/actions/reports.ts:77-80`(update), `:92`(delete) | 관리자 | authenticated |
| site_feedback | `lib/actions/feedback.ts:93` | 방문자 의견 insert | **service_role** (`:76`) |
| site_feedback | `lib/supabase/service.ts:27` | `select image_path limit 0` (업로드 가능 여부 점검) | **service_role**. select 명시 grant가 없다([확인이 필요한 지점](#확인이-필요한-지점)). |
| site_feedback | `lib/admin/queries.ts:156-159`, `lib/actions/feedback.ts:115-118`(update), `:130-133`(select), `:136`(delete) | 관리자 | authenticated |
| event_deletion_tombstones (+identities embed) | `lib/admin/queries.ts:120-133` | 재수집 제외 목록 | authenticated |
| admin_users | 직접 호출 없음 | `is_admin()`으로만 조회된다. | 해당 없음 |

### RPC
| RPC | 위치 | client |
|---|---|---|
| `is_admin` | `lib/admin/auth.ts:14` | authenticated |
| `increment_event_view` | `app/api/events/[slug]/view/route.ts:14` | anon (`:11`) |
| `consume_public_submission_rate_limit` | `lib/security/public-submission-rate-limit.ts:71` | service_role (`:61`) |
| `is_event_collection_excluded` | `lib/actions/admin/event.ts:93`, `lib/actions/admin/import.ts:40` | authenticated |
| `create_event_with_source` | `lib/actions/admin/event.ts:205`, `lib/actions/admin/import.ts:82` | authenticated |
| `update_event_with_source` | `lib/actions/admin/event.ts:221` | authenticated |
| `delete_event_and_exclude` | `lib/actions/admin/event.ts:307` | authenticated |
| `release_event_collection_exclusion` | `lib/actions/admin/event.ts:335` | authenticated |
| `replace_event_occurrences` | **앱에서 쓰지 않음** (`tests/production-occurrence-migration.test.ts`와 RB에서만 언급) | 해당 없음 |

### Storage
| 버킷 | 위치 | 동작 | client |
|---|---|---|---|
| event-images | `lib/actions/admin/event-image-storage.ts:42-48`(upload), `:50`(getPublicUrl), `:56`(remove) | 관리자 이미지 | authenticated. 호출부: `lib/actions/admin/image.ts:41`, `lib/actions/admin/event.ts:166`, `lib/actions/admin/import.ts:62`→`event-image-import.ts:114` |
| feedback-images | `lib/actions/feedback.ts:84-86`(upload), `:101`(실패 시 remove) | 방문자 첨부 | service_role |
| feedback-images | `lib/supabase/service.ts:26` (getBucket) | 업로드 가능 여부 점검 | service_role |
| feedback-images | `lib/admin/queries.ts:163-165`(createSignedUrl 1시간), `lib/actions/feedback.ts:139`(remove) | 관리자 | authenticated |

인증: `lib/actions/admin/auth.ts:24-27`(signInWithPassword), `:33-34`(signOut).

---

## 확인이 필요한 지점

재구축의 "데이터 모델·RLS" 영역에서 하나씩 판단할 재료입니다. 결정 전에는 고치지 않습니다.

### A. 이미 적용된 migration을 나중에 수정함 (환경 간 스키마 drift 가능)
1. **M08 + M09**: 커밋 4146fba(2026-07-20)가 M08의 `source_url text check (source_url is null or …)`를 `text not null check (… between 1 and 2048)`로 고쳤다. 같은 커밋에서 M09(`NOT VALID` check)도 추가했다.
   - 수정 전 M08이 이미 적용된 환경: 컬럼은 nullable이고 NOT VALID check만 있다. 기존 null 행이 남을 수 있다.
   - 새 DB: 컬럼이 이미 `not null`이라 M09는 중복이다.
   - 두 환경의 실제 스키마가 다르다. M09 주석("기존 제보는 유지하되", M09:9)은 앞의 경우에만 맞다.
2. **M03**: 커밋 673ff45(2026-08-04)가 2주 전 migration의 검증 조건을 `if exists (select 1 from public.events) and …`로 바꿨다. 기존 DB에는 영향이 없고 새 DB 재현용 수정이다. 다만 "적용된 migration은 고치지 않는다"는 관례와 다르다.

### B. 앞에서 만들고 뒤에서 되돌리거나 우회한 것
3. **공개 insert 정책**: M08:20-23과 M10:20-23에서 만들고 M15:4-5에서 삭제했다. anon insert grant(M08:31, M10:31)도 M15:7-8에서 회수했다. 그러나 **authenticated의 insert grant는 남아 있다.** RLS상 admin만 insert할 수 있어서 실제 위험은 낮다.
4. **events DELETE**: M01:177에서 authenticated에 grant했고 M14:88에서 anon·authenticated·service_role 모두에서 회수했다. 관리자도 직접 삭제할 수 없고 `delete_event_and_exclude`만 쓸 수 있다. 앱도 이 RPC만 쓴다(`event.ts:307`). **service_role 스크립트도 행사를 삭제할 수 없다.**
5. **`event_occurrences_event_start_idx`**: M04:21-22에서 만들고 M17:3에서 중복이라 삭제했다.
6. **`replace_event_occurrences`**(M04:46-75): M14의 `create_event_with_source`와 M16의 `update_event_with_source`로 대체됐지만 drop하지 않았다. 아직 남아 있는 문제:
   - `security invoker` + `search_path = public`이다. M15 hardening 대상에서 빠졌다.
   - authenticated에 실행 권한이 있다.
   - M14·M16이 거는 child-to-parent 잠금 순서와 tombstone 검사를 거치지 않는다. 단 statement 트리거가 전역 advisory lock은 잡는다.
   - 앱은 쓰지 않는다.
7. **`search_path`**: M01과 M07은 `public`이었고 M15:15-16에서 `''`로 바꿨다. `set_updated_at`(M01:105)과 `replace_event_occurrences`(M04:53)는 `public`으로 남아 있다. 둘 다 invoker라 위험은 낮다.

### C. Rollback 파일(RB)이 현재 스키마와 맞지 않음
8. RB는 M04+M05만 기준으로 작성됐다. 이후 생긴 의존성 때문에 지금은 실패하거나 앱을 깨뜨릴 가능성이 높다(추측. DB에서 실행해 보지 않았다).
   - `alter table events drop column schedule_mode`(RB:36): M14 statement 트리거의 `UPDATE OF … schedule_mode` 컬럼 목록(M14:1328)이 이 컬럼에 의존한다. PostgreSQL은 컬럼 지정 트리거에 컬럼 의존성을 기록하므로 drop이 거부될 것으로 보인다.
   - `drop table event_occurrences`(RB:34)가 성공하더라도 `create_event_with_source`(M14:1169)와 `update_event_with_source`(M16:221-232)가 런타임에 실패한다. plpgsql 본문은 의존성을 기록하지 않기 때문이다.
   - RB:22-31은 남은 회차가 하나라도 있으면 중단한다. 로컬에서는 seed 데모 회차(seed.sql:166-172) 때문에 항상 중단된다.

### D. 중복 또는 겹치는 인덱스
9. M17과 같은 논리로 보면 아래도 중복이다.
   - `event_sources_event_idx(event_id)`(M01:100)는 unique `(event_id, provider, original_url)`(M01:90)의 선두 컬럼과 겹친다.
   - `event_deletion_identities_tombstone_id_idx`(M14:56-57)는 unique `(tombstone_id, identity_key)`(M14:43-44)의 선두 컬럼과 겹친다.
   - `event_deletion_tombstones_deleted_at_idx`(M14:47-48)와 부분 인덱스 `…_active_deleted_at_idx`(M14:53-55)도 같은 컬럼·정렬이다. 앱 조회는 `released_at is null`과 `deleted_at desc`(`lib/admin/queries.ts:131-132`)뿐이다.

### E. RLS는 켜져 있는데 정책이 없거나 일부만 있는 테이블
10. `admin_users`(M01:136)는 정책이 0개다. 의도된 설계로, `is_admin()` DEFINER로만 읽는다.
11. `private.public_submission_rate_limits`(M18:29)도 정책이 0개다. grant도 전부 회수했고 RPC 소유자만 접근한다. 의도된 설계다.
12. `feedback-images` 버킷에는 INSERT·UPDATE 정책이 없다. 업로드는 service_role로만 한다(`feedback.ts:84`). 의도된 설계로 보인다.
13. `event_deletion_*` 테이블에는 "for all" 정책이 있지만 grant는 SELECT뿐이다(M14:81-84). 정책상 admin이 쓸 수 있어 보여도 실제로는 쓸 수 없다. 의도된 설계지만 정책 이름이 오해를 부를 수 있다.

### F. 함수 권한과 동작
14. **기본 권한에 기대는 부분** (추측):
    - M01, M04, M07은 `revoke all … from public`만 하고 anon·service_role을 명시적으로 회수하지 않는다. Supabase 기본 권한이 켜져 있다면 다음이 생긴다.
      - service_role이 `is_admin`·`increment_event_view`를 실행할 수 있다.
      - anon이 `replace_event_occurrences`를 실행할 수 있다. 다만 `is_admin()` 검사로 예외가 난다.
    - 반대로 기본 권한이 꺼져 있다면 `lib/supabase/service.ts:27`의 service_role `select image_path`에 grant가 없다. M15는 insert만 grant했다. 이 경우 피드백 사진 업로드 기능이 조용히 꺼진다(`isSiteFeedbackImageUploadAvailable`이 false를 돌려줌).
15. **M14 헬퍼 9개의 실행 권한**: 로그인한 모든 사용자에게 열려 있다(M14:1409-1417). 순수 함수와 트랜잭션 범위 advisory lock이라 위험은 낮다. 다만 앱이 직접 RPC로 부르는 헬퍼는 `is_event_collection_excluded`뿐이다.
16. **트리거 함수의 role 분기**: `reject_tombstoned_*`는 `current_setting('role') = 'authenticated'`이고 admin이 아니면 검사 없이 통과시킨다(M14:1192-1196 등). 그 뒤 RLS가 막는다는 가정이다. service_role, postgres, seed 실행 시에는 검사를 수행한다. 따라서 seed나 수동 SQL에서 source_url이 정규화 불가능하면 insert가 실패한다.
17. **조회수 증가가 `updated_at`을 바꾼다**: `increment_event_view`의 update에도 `set_events_updated_at`(M01:113-115, 컬럼 제한 없음)이 걸린다. 그래서 상세 페이지를 조회할 때마다 `events.updated_at`이 갱신되고, `updated_at`이 "내용 수정 시각"을 뜻하지 않게 된다. 직렬화 트리거는 `view_count`를 컬럼 목록에서 뺐다(M14:1317-1355). 조회수를 의식한 설계인데 updated_at 트리거는 손대지 않았다.
18. **조회수 RPC에는 요청 제한이 없다**: anon이 무제한 호출할 수 있다(M07:35, route.ts:14). 제출 기능과 달리 rate-limit이 없다.
19. **생성과 수정 RPC의 검증이 다르다**:
    - `update_event_with_source`만 occurrence 키 검증(M16:78-87)과 `schedule_mode`/회차 수 일치 검증(M16:136-144)을 한다. `create_event_with_source`에는 둘 다 없다.
    - 허용 필드도 다르다. create는 `description`, `latitude`/`longitude`, `location_*`, `official_url`을 받는다(M14:975-997). update는 이 필드를 받지 않아 수정으로는 바꿀 수 없다.
    - update에서 `p_event`에 빠진 키는 `jsonb_to_record` 때문에 NULL로 덮어써진다(M16:89-118, 190-217). 앱은 항상 전체 payload를 보낸다(`lib/admin/event-write.ts:11-38`).
    - `event-write.ts:38`은 `official_url`이 있으면 payload에 넣는데, update allow-list에 없어서 오류가 날 수 있다. 다만 `eventFormSchema`에 `officialUrl`이 없어 현재는 실행되지 않는 코드로 보인다(추측).
20. **`is_admin()` 실행 권한이 anon에 있다**(M01:134): anon용 정책 중 `is_admin()`을 부르는 것은 없다. 불필요한 권한이지만 항상 false를 돌려주므로 무해하다.
21. **`event-images`의 select 정책**: anon도 storage list API로 버킷 전체 파일 목록을 볼 수 있다(M01:186-189). 공개 버킷이라 파일 URL 접근에는 이 정책이 필요 없다.

### G. 데이터 backfill 관련
22. **하드코딩된 운영 UUID**: M03, M05, RB는 특정 UUID를 하드코딩한다. 빈 DB에서는 no-op이 되게 가드했다(M03:80, M05:29).
    - M03:27의 `7d933329-…`은 좌표가 `37.511824, 127.059159`다. 서울 강남(삼성동 부근)이라 다른 속초 좌표와 동떨어져 있다. 행사가 실제로 서울에서 열렸을 수도 있으니 원문 확인이 필요하다(추측).
23. **M03의 트랜잭션 구문**: 파일 안에 `begin; … commit;`(M03:4, 277)이 있다. Supabase CLI가 migration을 자체 트랜잭션으로 감싼다면 중첩 BEGIN 경고나 조기 COMMIT이 생길 수 있다(추측. CLI 동작은 확인하지 않았다).
24. **M06과 seed.sql 중복**: 같은 명소 122곳을 slug 기준으로 upsert한다. migration은 한 번만 실행되지만, 로컬에서 `db reset`을 하면 seed가 다시 덮어쓴다. 운영에서 관리자가 수정한 명소는 M06을 재실행하지 않는 한 유지된다.
25. **M13은 일방향 변경이다**: `description`을 `summary`로 복사했다. `description` 컬럼은 남겨 뒀지만 수정 RPC가 쓰지 않으므로, 이후 두 값이 어긋날 수 있다.

### H. 기타
26. **tombstone의 원래 행사 id**: `event_deletion_tombstones.original_event_id`에는 FK가 없다. 삭제된 행사를 가리키므로 의도된 설계다. 대신 `event_snapshot`(to_jsonb 전체 행)이 유일한 복구 수단이다(M14:829).
27. **service_role의 tombstone 접근**: service_role은 tombstone·identity 테이블을 읽을 수 없고(M14:81-82) 관련 RPC 실행 권한도 없다(M14:1391-1407). 서버 배치나 스크립트에서 재수집 제외 여부를 확인하려면 authenticated admin 세션이 필요하다. 현재 `scripts/`에서 Supabase 호출은 찾지 못했다.
