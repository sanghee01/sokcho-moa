import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260803015356_prevent_deleted_event_recollection.sql",
  ),
  "utf8",
);
const normalizedMigration = migration.toLowerCase();

function functionSql(name: string, nextName: string) {
  const start = normalizedMigration.indexOf(`create or replace function public.${name}`);
  const end = normalizedMigration.indexOf(`create or replace function public.${nextName}`, start + 1);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return normalizedMigration.slice(start, end);
}

describe("deleted-event recollection suppression migration", () => {
  it("creates an indexed parent snapshot and independently owned child identity ledger", () => {
    expect(normalizedMigration).toContain("create table public.event_deletion_tombstones");
    expect(normalizedMigration).toContain("original_event_id uuid not null");
    expect(normalizedMigration).not.toContain("original_event_id uuid not null unique");
    expect(normalizedMigration).toContain("original_title text not null");
    expect(normalizedMigration).toContain("original_slug text not null");
    expect(normalizedMigration).toContain("event_snapshot jsonb not null");
    expect(normalizedMigration).toContain("deleted_by uuid not null");
    expect(normalizedMigration).toContain("deleted_at timestamptz not null default now()");
    expect(normalizedMigration).toContain("reason text");
    expect(normalizedMigration).toContain("released_at timestamptz");
    expect(normalizedMigration).toContain("released_by uuid");
    expect(normalizedMigration).toContain("event_deletion_tombstones_release_audit_pair");
    expect(normalizedMigration).toContain("event_deletion_tombstones_active_deleted_at_idx");
    expect(normalizedMigration).toContain("event_deletion_tombstones_original_event_id_idx");

    expect(normalizedMigration).toContain("create table public.event_deletion_identities");
    expect(normalizedMigration).toContain("references public.event_deletion_tombstones(id) on delete cascade");
    expect(normalizedMigration).toContain("identity_key text not null");
    expect(normalizedMigration).toContain("unique (tombstone_id, identity_key)");
    expect(normalizedMigration).toContain("kind text not null");
    expect(normalizedMigration).toContain("source_namespace text not null");
    expect(normalizedMigration).toContain("identity_value text not null");
    expect(normalizedMigration).toContain("source_url text");
    expect(normalizedMigration).toContain("event_deletion_identities_tombstone_id_idx");
    expect(normalizedMigration).toContain("event_deletion_identities_identity_key_idx");
    expect(normalizedMigration).not.toContain("event_deletion_identities_lookup_idx");
  });

  it("enables RLS and gives authenticated admins only the operations used by the UI", () => {
    expect(normalizedMigration).toContain(
      "alter table public.event_deletion_tombstones enable row level security",
    );
    expect(normalizedMigration).toContain(
      "alter table public.event_deletion_identities enable row level security",
    );
    expect(normalizedMigration).toContain('create policy "admins manage event deletion tombstones"');
    expect(normalizedMigration).toContain('create policy "admins manage event deletion identities"');
    expect(normalizedMigration.match(/using \(\(select public\.is_admin\(\)\)\)/g)).toHaveLength(2);
    expect(normalizedMigration.match(/with check \(\(select public\.is_admin\(\)\)\)/g)).toHaveLength(2);

    expect(normalizedMigration).toContain(
      "revoke all on table public.event_deletion_tombstones from public, anon, authenticated, service_role",
    );
    expect(normalizedMigration).toContain(
      "revoke all on table public.event_deletion_identities from public, anon, authenticated, service_role",
    );
    expect(normalizedMigration).toContain(
      "grant select on table public.event_deletion_tombstones to authenticated",
    );
    expect(normalizedMigration).toContain(
      "grant select on table public.event_deletion_identities to authenticated",
    );
    expect(normalizedMigration).not.toMatch(
      /grant\s+[^;]+on table public\.event_deletion_(?:tombstones|identities)\s+to\s+anon/,
    );
    expect(normalizedMigration).not.toMatch(
      /grant\s+[^;]*(?:insert|update|delete|all)[^;]+event_deletion_(?:tombstones|identities)/,
    );
    expect(normalizedMigration).toContain(
      "revoke delete on table public.events from anon, authenticated, service_role",
    );
  });

  it("defines deterministic URL, namespace, external-ID, and identity helpers", () => {
    for (const helper of [
      "decode_event_url_component",
      "canonicalize_event_url_path",
      "normalize_event_source_url",
      "extract_event_source_external_id",
      "event_source_namespace",
      "event_source_global_namespace",
      "event_deletion_identity_key",
      "event_deletion_identity_keys",
    ]) {
      const helperStart = normalizedMigration.indexOf(`create or replace function public.${helper}`);
      expect(helperStart).toBeGreaterThanOrEqual(0);
      expect(normalizedMigration.slice(helperStart, helperStart + 700)).toContain("immutable");
    }

    for (const queryKey of [
      "fstvlcntntsid",
      "eventseq",
      "articleseq",
      "contentseq",
      "pseq",
      "eduno",
      "idx",
      "ntt_id",
      "destid",
    ]) {
      expect(normalizedMigration).toContain(`'${queryKey}'`);
    }

    expect(normalizedMigration).toContain("'fbclid', 'gclid', 'dclid', 'msclkid'");
    expect(normalizedMigration).toContain("not like 'utm\\_%'");
    expect(normalizedMigration).toContain("p_plus_as_space and current_character = '+'");
    expect(normalizedMigration).toContain("decoded_segment = '..'");
    expect(normalizedMigration).toContain("regexp_replace(normalized_authority, ':0*443$', '')");
    expect(normalizedMigration).toContain("regexp_replace(normalized_authority, ':0*80$', '')");
    expect(normalizedMigration).toContain("regexp_replace(normalized_authority, ':$', '')");
    expect(normalizedMigration).toContain("':0+([1-9][0-9]*)$'");
    expect(normalizedMigration).toContain("regexp_replace(normalized_authority, ':0+$', ':0')");
    expect(normalizedMigration).toContain("octet_length(url_parts[2]) <> char_length(url_parts[2])");
    expect(normalizedMigration).toContain("encode(convert_to(query_value, 'utf8'), 'hex')");
    expect(normalizedMigration).toContain("'slug'::text as kind");
    expect(normalizedMigration).toContain("'url'");
    expect(normalizedMigration).toContain("'external_id'");
    expect(normalizedMigration).toContain("sha256(convert_to(");
    expect(normalizedMigration).toContain("'utf8'");
    expect(normalizedMigration).toContain("'bbsid', 'bbs_id', 'bbsidx', 'bbs_idx'");
    const globalNamespace = functionSql(
      "event_source_global_namespace",
      "event_deletion_identity_key",
    );
    expect(globalNamespace).toContain("'fstvlcntntsid'");
    expect(globalNamespace).toContain("'destid'");
    expect(globalNamespace).not.toContain("'idx'");
    expect(globalNamespace).not.toContain("'ntt_id'");
    expect(globalNamespace).not.toContain("'eduno'");
  });

  it("funnels hard deletion through one admin-checked security-definer RPC", () => {
    const rpc = functionSql("delete_event_and_exclude", "release_event_collection_exclusion");
    const tombstoneInsert = rpc.indexOf("insert into public.event_deletion_tombstones");
    const identityInsert = rpc.indexOf("insert into public.event_deletion_identities");
    const sourceRead = rpc.lastIndexOf("from public.event_sources as event_source");
    const eventDelete = rpc.indexOf("delete from public.events");

    expect(rpc).toContain("returns text");
    expect(rpc).toContain("security definer");
    expect(rpc).toContain("set search_path = ''");
    expect(rpc).toContain("if not (select public.is_admin()) then");
    expect(rpc).toContain("'sokcho-moa:event-collection-mutations:v1'");
    expect(rpc.indexOf("'sokcho-moa:event-collection-mutations:v1'")).toBeLessThan(
      rpc.indexOf("from public.event_sources as event_source"),
    );
    expect(rpc).toContain("order by event_source.id");
    expect(rpc).toContain("order by occurrence.id");
    expect(rpc).toContain("for update");
    expect(rpc).toContain("order by distinct_identity.identity_key collate \"c\"");
    expect(rpc).toContain("pg_advisory_xact_lock(hashtextextended(locked_identity_key, 0))");
    expect(rpc).toContain("to_jsonb(deleted_event)");
    expect(rpc).toContain("deleted_event.source_url as source_url");
    expect(rpc).toContain("event_source.original_url");
    expect(rpc).toContain("event_source.external_id");
    expect(rpc).toContain("on conflict (tombstone_id, identity_key) do nothing");
    expect(rpc).toContain("get diagnostics affected_rows = row_count");
    expect(rpc).toContain("if affected_rows <> 1 then");
    expect(rpc).toContain("return deleted_event.slug");

    expect(tombstoneInsert).toBeGreaterThanOrEqual(0);
    expect(identityInsert).toBeGreaterThan(tombstoneInsert);
    expect(sourceRead).toBeGreaterThan(identityInsert);
    expect(eventDelete).toBeGreaterThan(sourceRead);
  });

  it("releases suppression by audit state without deleting its tombstone", () => {
    const rpc = functionSql(
      "release_event_collection_exclusion",
      "create_event_with_source",
    );

    expect(rpc).toContain("returns boolean");
    expect(rpc).toContain("security definer");
    expect(rpc).toContain("set search_path = ''");
    expect(rpc).toContain("if not (select public.is_admin()) then");
    expect(rpc).toContain("for update");
    expect(rpc).toContain("pg_advisory_xact_lock(hashtextextended(locked_identity_key, 0))");
    expect(rpc).toContain("released_at = statement_timestamp()");
    expect(rpc).toContain("released_by = (select auth.uid())");
    expect(rpc).toContain("and released_at is null");
    expect(rpc).not.toContain("delete from public.event_deletion_tombstones");
  });

  it("creates the event, first source, and occurrences in one guarded transaction", () => {
    const rpc = functionSql("create_event_with_source", "reject_tombstoned_event_insert");
    const eventInsert = rpc.indexOf("insert into public.events");
    const sourceInsert = rpc.indexOf("insert into public.event_sources");
    const occurrenceInsert = rpc.indexOf("insert into public.event_occurrences");

    expect(rpc).toContain("p_event jsonb");
    expect(rpc).toContain("p_occurrences jsonb default '[]'::jsonb");
    expect(rpc).toContain("p_source_checked_at timestamptz default null");
    expect(rpc).toContain("returns uuid");
    expect(rpc).toContain("security definer");
    expect(rpc).toContain("set search_path = ''");
    expect(rpc).toContain("if not (select public.is_admin()) then");
    expect(rpc).toContain("jsonb_typeof(p_event) <> 'object'");
    expect(rpc).toContain("jsonb_typeof(p_occurrences) <> 'array'");
    expect(rpc).toContain("jsonb_object_keys(p_event)");
    expect(rpc).toContain("p_event contains an unsupported field");
    expect(rpc).toContain("jsonb_to_record(p_event)");
    for (const serverOwnedField of [
      "id",
      "review_status",
      "published_at",
      "is_demo",
      "view_count",
      "created_at",
      "updated_at",
    ]) {
      expect(rpc).not.toContain(`'${serverOwnedField}',`);
    }
    expect(rpc).toContain("derived_external_id := public.extract_event_source_external_id(event_input.source_url)");
    expect(rpc).not.toContain("p_external_id");
    expect(rpc).toContain("'sokcho-moa:event-collection-mutations:v1'");
    expect(rpc.indexOf("'sokcho-moa:event-collection-mutations:v1'")).toBeLessThan(
      eventInsert,
    );
    expect(rpc).toContain("public.lock_event_deletion_identity_keys(");
    expect(rpc).toContain("public.is_event_collection_excluded(");
    expect(rpc).toContain("'pending'");
    expect(rpc).toContain("jsonb_to_recordset(p_occurrences)");
    expect(rpc).toContain("return new_event_id");
    expect(rpc).not.toContain("exception when others");

    expect(eventInsert).toBeGreaterThanOrEqual(0);
    expect(sourceInsert).toBeGreaterThan(eventInsert);
    expect(occurrenceInsert).toBeGreaterThan(sourceInsert);
  });

  it("checks suppression at both insertion boundaries", () => {
    const eventTrigger = functionSql(
      "reject_tombstoned_event_insert",
      "reject_tombstoned_event_source_insert",
    );
    const sourceTriggerStart = normalizedMigration.indexOf(
      "create or replace function public.reject_tombstoned_event_source_insert",
    );
    const sourceTriggerEnd = normalizedMigration.indexOf(
      "create or replace function public.reject_tombstoned_event_publish",
      sourceTriggerStart,
    );
    const sourceTrigger = normalizedMigration.slice(sourceTriggerStart, sourceTriggerEnd);
    const publishTriggerStart = normalizedMigration.indexOf(
      "create or replace function public.reject_tombstoned_event_publish",
    );
    const publishTriggerEnd = normalizedMigration.indexOf(
      "-- use a statement trigger",
      publishTriggerStart,
    );
    const publishTrigger = normalizedMigration.slice(publishTriggerStart, publishTriggerEnd);

    expect(eventTrigger).toContain("security definer");
    expect(sourceTrigger).toContain("security definer");
    expect(publishTrigger).toContain("security definer");
    for (const triggerFunction of [eventTrigger, sourceTrigger, publishTrigger]) {
      expect(triggerFunction).toContain("current_setting('role', true) = 'authenticated'");
      expect(triggerFunction).toContain("and not (select public.is_admin())");
      expect(triggerFunction).toContain("return new");
    }
    expect(eventTrigger).toContain("events_source_url_canonical");
    expect(sourceTrigger).toContain("event_sources_url_canonical");
    expect(publishTrigger).toContain("where source.event_id = new.id");
    expect(publishTrigger).toContain("source.original_url");
    expect(publishTrigger).toContain("source.external_id");
    expect(publishTrigger).toContain(
      "order by distinct_identity.identity_key collate \"c\"",
    );
    expect(publishTrigger).toMatch(
      /public\.is_event_collection_excluded\(\s*null,\s*source\.original_url,\s*source\.external_id\s*\)/,
    );
    expect(normalizedMigration).toContain(
      "create or replace function public.is_event_collection_excluded",
    );
    expect(normalizedMigration).toContain(
      "join public.event_deletion_identities as deleted_identity",
    );
    expect(normalizedMigration).toContain(
      "join public.event_deletion_tombstones as tombstone",
    );
    expect(normalizedMigration).toContain("and tombstone.released_at is null");
    expect(normalizedMigration).toContain("create trigger prevent_deleted_event_recollection");
    expect(normalizedMigration).toContain(
      "before insert or update of slug, source_url on public.events",
    );
    expect(normalizedMigration).toContain("create trigger prevent_deleted_event_publish");
    expect(normalizedMigration).toContain("before update of review_status on public.events");
    expect(normalizedMigration).toContain("new.review_status = 'published'");
    expect(normalizedMigration).toContain(
      "old.review_status is distinct from new.review_status",
    );
    expect(normalizedMigration).toContain(
      "create trigger prevent_deleted_event_source_recollection",
    );
    expect(normalizedMigration).toContain(
      "before insert or update of event_id, original_url, external_id on public.event_sources",
    );
    expect(normalizedMigration).toContain(
      "public.is_event_collection_excluded(new.slug, new.source_url, null)",
    );
    expect(normalizedMigration).toContain(
      "public.lock_event_deletion_identity_keys(new.slug, new.source_url, null)",
    );
    expect(normalizedMigration).toContain(
      "public.is_event_collection_excluded(null, new.original_url, new.external_id)",
    );
    expect(normalizedMigration).toContain(
      "public.lock_event_deletion_identity_keys(null, new.original_url, new.external_id)",
    );
    expect(sourceTrigger).toContain("where event.id = new.event_id");
    expect(sourceTrigger).toContain("for key share");
    expect(normalizedMigration.match(/event_collection_excluded:/g)).toHaveLength(4);
  });

  it("serializes every event aggregate write before row locks can form a cycle", () => {
    const guard = functionSql(
      "serialize_event_collection_mutations",
      "is_event_collection_excluded",
    );

    expect(guard).toContain("returns trigger");
    expect(guard).toContain("security definer");
    expect(guard).toContain("set search_path = ''");
    expect(guard).toContain("pg_advisory_xact_lock");
    expect(guard).toContain("'sokcho-moa:event-collection-mutations:v1'");

    const eventSerializationTriggerStart = normalizedMigration.indexOf(
      "create trigger serialize_event_collection_mutations",
    );
    const eventSerializationTriggerEnd = normalizedMigration.indexOf(
      "for each statement execute function public.serialize_event_collection_mutations()",
      eventSerializationTriggerStart,
    );
    const eventSerializationTrigger = normalizedMigration.slice(
      eventSerializationTriggerStart,
      eventSerializationTriggerEnd,
    );
    for (const eventColumn of [
      "id",
      "slug",
      "title",
      "source_url",
      "review_status",
      "updated_at",
    ]) {
      expect(eventSerializationTrigger).toMatch(new RegExp(`\\b${eventColumn}\\b`));
    }
    expect(eventSerializationTrigger).not.toMatch(/\bview_count\b/);
    expect(normalizedMigration).not.toContain(
      "before insert or update or delete on public.events",
    );

    for (const table of ["event_sources", "event_occurrences"]) {
      expect(normalizedMigration).toContain(
        `before insert or update or delete on public.${table}`,
      );
      expect(normalizedMigration).toContain(
        "for each statement execute function public.serialize_event_collection_mutations()",
      );
    }
  });

  it("removes PUBLIC and anon execution while exposing required calls to authenticated", () => {
    for (const signature of [
      "decode_event_url_component(text, boolean)",
      "canonicalize_event_url_path(text)",
      "normalize_event_source_url(text)",
      "extract_event_source_external_id(text)",
      "event_source_namespace(text)",
      "event_source_global_namespace(text)",
      "event_deletion_identity_key(text, text, text)",
      "event_deletion_identity_keys(text, text, text)",
      "lock_event_deletion_identity_keys(text, text, text)",
      "is_event_collection_excluded(text, text, text)",
      "delete_event_and_exclude(uuid, text)",
      "release_event_collection_exclusion(uuid)",
      "create_event_with_source(jsonb, jsonb, timestamptz)",
    ]) {
      expect(normalizedMigration).toContain(
        `revoke all on function public.${signature} from public, anon, authenticated, service_role`,
      );
      expect(normalizedMigration).toContain(
        `grant execute on function public.${signature} to authenticated`,
      );
    }

    expect(normalizedMigration).toContain(
      "revoke all on function public.reject_tombstoned_event_insert() from public, anon, authenticated, service_role",
    );
    expect(normalizedMigration).toContain(
      "revoke all on function public.reject_tombstoned_event_source_insert() from public, anon, authenticated, service_role",
    );
    expect(normalizedMigration).toContain(
      "revoke all on function public.reject_tombstoned_event_publish() from public, anon, authenticated, service_role",
    );
    expect(normalizedMigration).toContain(
      "revoke all on function public.serialize_event_collection_mutations() from public, anon, authenticated, service_role",
    );
    expect(normalizedMigration).not.toContain(
      "grant execute on function public.reject_tombstoned_event_insert()",
    );
    expect(normalizedMigration).not.toContain(
      "grant execute on function public.reject_tombstoned_event_source_insert()",
    );
    expect(normalizedMigration).not.toContain(
      "grant execute on function public.reject_tombstoned_event_publish()",
    );
    expect(normalizedMigration).not.toContain(
      "grant execute on function public.serialize_event_collection_mutations()",
    );
    expect(normalizedMigration).not.toMatch(/grant execute on function [^;]+ to anon/);
  });
});
