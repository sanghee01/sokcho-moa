import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const functionSource = readFileSync(
  resolve(
    process.cwd(),
    "supabase/functions/dispatch-notifications/index.ts",
  ),
  "utf8",
);

describe("notification dispatch Edge Function contract", () => {
  it("requires an internal secret and keeps server credentials server-only", () => {
    expect(functionSource).toContain('Deno.env.get("NOTIFICATION_DISPATCH_SECRET")');
    expect(functionSource).toContain('request.headers.get("x-dispatch-secret")');
    expect(functionSource).toContain('requiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(functionSource).not.toContain("EXPO_PUBLIC_");
  });

  it("evaluates the safe default before entering the live dispatch branch", () => {
    const dryRunGate = functionSource.indexOf(
      'isDryRun(Deno.env.get("DRY_RUN"))',
    );
    const dryRunBranch = functionSource.indexOf("if (dryRun)");
    const liveDispatch = functionSource.indexOf("dispatchLive(");
    expect(dryRunGate).toBeGreaterThan(-1);
    expect(dryRunBranch).toBeGreaterThan(dryRunGate);
    expect(liveDispatch).toBeGreaterThan(dryRunBranch);
    expect(functionSource).toContain('mode: "DRY_RUN"');
    expect(functionSource).toContain("networkRequests: 0");
  });

  it("contains the Expo network endpoint only inside the explicit live helper", () => {
    const liveHelper = functionSource.indexOf("async function sendExpoMessages");
    const expoEndpoint = functionSource.indexOf(
      "https://exp.host/--/api/v2/push/send",
    );
    expect(liveHelper).toBeGreaterThan(-1);
    expect(expoEndpoint).toBeGreaterThan(liveHelper);
  });
});
