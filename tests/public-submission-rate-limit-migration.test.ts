import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260804020600_public_submission_rate_limits.sql"),
  "utf8",
).toLowerCase();
const functionStart = migration.indexOf(
  "create or replace function public.consume_public_submission_rate_limit",
);
const functionEnd = migration.indexOf(
  "revoke all on function public.consume_public_submission_rate_limit",
  functionStart,
);
const rateLimitRpc = migration.slice(functionStart, functionEnd);

describe("public submission rate-limit migration", () => {
  it("keeps HMAC counters in a non-exposed, access-revoked schema", () => {
    expect(migration).toContain("create schema if not exists private");
    expect(migration).toContain("create table if not exists private.public_submission_rate_limits");
    expect(migration).toContain("key_hash text not null");
    expect(migration).toContain("scope in ('event_report', 'site_feedback')");
    expect(migration).toContain("key_hash ~ '^[0-9a-f]{64}$'");
    expect(migration).toContain("alter table private.public_submission_rate_limits enable row level security");
    expect(migration).toContain(
      "revoke all on table private.public_submission_rate_limits\n  from public, anon, authenticated, service_role",
    );
  });

  it("atomically consumes a fixed-window counter and returns a retry delay", () => {
    expect(rateLimitRpc).toContain("insert into private.public_submission_rate_limits as rate_limit");
    expect(rateLimitRpc).toContain("on conflict (scope, key_hash) do update");
    expect(rateLimitRpc).toContain("least(rate_limit.request_count, p_limit) + 1");
    expect(rateLimitRpc).toContain("consumed.request_count <= p_limit");
    expect(rateLimitRpc).toContain("retry_after_seconds");
    expect(rateLimitRpc).toContain("delete from private.public_submission_rate_limits as stale");
    expect(rateLimitRpc).toContain("order by candidate.window_ends_at");
    expect(rateLimitRpc).toContain("limit 100");
  });

  it("validates every caller-controlled value", () => {
    expect(rateLimitRpc).toContain(
      "p_scope is null or p_scope not in ('event_report', 'site_feedback')",
    );
    expect(rateLimitRpc).toContain("p_key_hash is null or p_key_hash !~");
    expect(rateLimitRpc).toContain("p_limit is null or p_limit < 1 or p_limit > 1000");
    expect(rateLimitRpc).toContain(
      "p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400",
    );
  });

  it("exposes the definer RPC only to service_role with an empty search path", () => {
    expect(rateLimitRpc).toContain("security definer");
    expect(rateLimitRpc).toContain("set search_path = ''");
    expect(migration).toContain(
      "revoke all on function public.consume_public_submission_rate_limit(text, text, integer, integer)\n  from public, anon, authenticated, service_role",
    );
    expect(migration).toContain(
      "grant execute on function public.consume_public_submission_rate_limit(text, text, integer, integer)\n  to service_role",
    );
    expect(migration).not.toMatch(
      /grant execute on function public\.consume_public_submission_rate_limit[^;]+to (anon|authenticated)/,
    );
  });
});
