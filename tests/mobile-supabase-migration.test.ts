import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202607260001_mobile_preferences.sql",
  ),
  "utf8",
);
const initialMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/202607190001_initial_schema.sql"),
  "utf8",
);

describe("mobile preference RLS migration", () => {
  it("ties both private tables to Auth users and enables RLS", () => {
    expect(migration).toContain(
      "user_id uuid primary key references auth.users(id) on delete cascade",
    );
    expect(migration).toContain(
      "user_id uuid not null references auth.users(id) on delete cascade",
    );
    expect(migration).toContain(
      "alter table public.notification_preferences enable row level security",
    );
    expect(migration).toContain(
      "alter table public.saved_events enable row level security",
    );
  });

  it("grants CRUD only to authenticated owners and explicitly denies anon", () => {
    expect(migration.match(/to authenticated/g)).toHaveLength(3);
    expect(migration.match(/using \(\(select auth\.uid\(\)\) = user_id\)/g))
      .toHaveLength(2);
    expect(migration.match(/with check \(\(select auth\.uid\(\)\) = user_id\)/g))
      .toHaveLength(2);
    expect(migration).toContain(
      "revoke all on public.notification_preferences, public.saved_events from anon",
    );
    expect(migration).not.toMatch(/create policy[\s\S]*?\bto anon\b/);
  });

  it("keeps anonymous authenticated users outside the admin allow-list", () => {
    expect(initialMigration).toContain(
      "select 1 from public.admin_users where user_id = (select auth.uid())",
    );
    expect(initialMigration).toContain("using ((select public.is_admin()))");
    expect(migration).not.toContain("public.is_admin()");
  });

  it("limits preference values and uses event foreign keys for cleanup", () => {
    expect(migration).toContain("categories public.event_category[]");
    expect(migration).toContain(
      "audiences <@ array['child', 'youth', 'family', 'adult', 'all']::text[]",
    );
    expect(migration).toContain(
      "event_id uuid not null references public.events(id) on delete cascade",
    );
    expect(migration).toContain("primary key (user_id, event_id)");
  });
});
