import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(new URL(
  "../supabase/migrations/20260804014839_harden_public_submission_boundaries.sql",
  import.meta.url,
));
const migration = readFileSync(migrationPath, "utf8").replace(/\s+/g, " ").toLowerCase();

describe("public submission database boundary", () => {
  it("익명 역할의 직접 insert 경로를 닫고 서버 역할만 명시적으로 허용한다", () => {
    expect(migration).toContain('drop policy if exists "anyone can submit event reports"');
    expect(migration).toContain('drop policy if exists "anyone can submit site feedback"');
    expect(migration).toContain("revoke insert on table public.event_reports from public, anon");
    expect(migration).toContain("revoke insert on table public.site_feedback from public, anon");
    expect(migration).toContain("grant insert on table public.event_reports to service_role");
    expect(migration).toContain("grant insert on table public.site_feedback to service_role");
  });

  it("기존 SECURITY DEFINER 함수가 빈 search_path를 사용하도록 고정한다", () => {
    expect(migration).toContain("alter function public.is_admin() set search_path = ''");
    expect(migration).toContain("alter function public.increment_event_view(text) set search_path = ''");
  });
});
