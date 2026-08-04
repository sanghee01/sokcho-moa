import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260804014903_atomic_event_updates.sql"),
  "utf8",
).toLowerCase();
const eventAction = readFileSync(
  resolve(process.cwd(), "lib/actions/admin/event.ts"),
  "utf8",
);

const functionStart = migration.indexOf("create or replace function public.update_event_with_source");
const functionEnd = migration.indexOf("revoke all on function public.update_event_with_source", functionStart);
const updateRpc = migration.slice(functionStart, functionEnd);

describe("atomic administrator event update migration", () => {
  it("updates the complete event aggregate inside one RPC", () => {
    expect(functionStart).toBeGreaterThanOrEqual(0);
    expect(functionEnd).toBeGreaterThan(functionStart);
    expect(updateRpc).toContain("update public.events as event");
    expect(updateRpc).toContain("delete from public.event_occurrences");
    expect(updateRpc).toContain("insert into public.event_occurrences");
    expect(updateRpc).toContain("insert into public.event_sources");
    expect(updateRpc).toContain("on conflict (event_id, provider, original_url) do update");

    const eventUpdate = updateRpc.indexOf("update public.events as event");
    const occurrenceReplacement = updateRpc.indexOf("delete from public.event_occurrences");
    const sourceUpsert = updateRpc.indexOf("insert into public.event_sources");
    expect(eventUpdate).toBeLessThan(occurrenceReplacement);
    expect(occurrenceReplacement).toBeLessThan(sourceUpsert);
  });

  it("authorizes the definer function explicitly and fixes its search path", () => {
    expect(updateRpc).toContain("security definer");
    expect(updateRpc).toContain("set search_path = ''");
    expect(updateRpc).toContain("if not (select public.is_admin()) then");
    expect(updateRpc).toContain("using errcode = '42501'");
    expect(migration).toContain(
      "revoke all on function public.update_event_with_source(uuid, jsonb, jsonb, timestamptz)\n  from public, anon, authenticated, service_role",
    );
    expect(migration).toContain(
      "grant execute on function public.update_event_with_source(uuid, jsonb, jsonb, timestamptz)\n  to authenticated",
    );
    expect(migration).not.toMatch(/grant execute on function public\.update_event_with_source[^;]+to anon/);
  });

  it("keeps summary as the only writable introduction and preserves server-owned fields", () => {
    expect(updateRpc).toContain("summary = event_input.summary");
    expect(updateRpc).not.toContain("'description',");
    expect(updateRpc).not.toMatch(/\n\s*description\s*=/);
    for (const protectedColumn of [
      "review_status",
      "published_at",
      "is_demo",
      "view_count",
      "latitude",
      "longitude",
      "location_source_url",
      "location_verified_at",
      "official_url",
    ]) {
      expect(updateRpc).not.toMatch(new RegExp(`\\n\\s*${protectedColumn}\\s*=`));
    }
  });

  it("validates aggregate inputs and participates in deletion-suppression locking", () => {
    expect(updateRpc).toContain("p_event must be a json object");
    expect(updateRpc).toContain("p_occurrences must be a json array");
    expect(updateRpc).toContain("p_event contains an unsupported field");
    expect(updateRpc).toContain("pg_advisory_xact_lock");
    expect(updateRpc).toContain("public.lock_event_deletion_identity_keys");
    expect(updateRpc).toContain("public.is_event_collection_excluded");
    expect(updateRpc).toContain("for update");
  });

  it("leaves the existing create RPC unchanged", () => {
    expect(migration).not.toContain("create or replace function public.create_event_with_source");
  });

  it("routes edits through the aggregate RPC and cleans a new image on failure", () => {
    expect(eventAction).toContain('client.rpc("update_event_with_source"');
    expect(eventAction).not.toContain('.from("events").update(payload)');
    expect(eventAction).toContain("let newImagePath: string | null = null");
    expect(eventAction).not.toContain("eventImagePathFromPublicUrl");

    const updateCall = eventAction.indexOf('client.rpc("update_event_with_source"');
    const updateFailure = eventAction.indexOf("if (error || typeof updatedEventId", updateCall);
    const cleanup = eventAction.indexOf("await removeEventImage(client, newImagePath)", updateFailure);
    expect(updateFailure).toBeGreaterThan(updateCall);
    expect(cleanup).toBeGreaterThan(updateFailure);
  });
});
