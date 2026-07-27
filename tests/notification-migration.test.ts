import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202607260002_notification_outbox.sql",
  ),
  "utf8",
);

describe("notification outbox migration", () => {
  it("enforces one candidate and one device delivery at the database layer", () => {
    expect(migration).toContain("dedupe_key text not null unique");
    expect(migration).toContain("unique (outbox_id, device_id)");
    expect(migration).toContain("expo_push_token text not null unique");
  });

  it("lets users manage only their own devices while keeping server tables private", () => {
    expect(migration).toContain(
      "using ((select auth.uid()) = user_id)",
    );
    expect(migration).toContain(
      "with check ((select auth.uid()) = user_id)",
    );
    expect(migration).toContain(
      "revoke all on public.notification_outbox, public.notification_deliveries",
    );
    expect(migration).toContain("from anon, authenticated");
    expect(migration).toContain("to service_role");
  });

  it("claims work atomically and recovers only stale processing rows", () => {
    expect(migration).toContain("for update skip locked");
    expect(migration).toContain("candidate.locked_at < now() - interval '15 minutes'");
    expect(migration).toContain("attempt_count = outbox.attempt_count + 1");
    expect(migration).toContain("if (select auth.role()) <> 'service_role'");
    expect(migration).toContain(
      "revoke all on function public.claim_notification_outbox(integer, uuid)",
    );
  });
});
