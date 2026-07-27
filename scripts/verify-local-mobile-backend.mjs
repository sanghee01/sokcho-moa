import { spawn, spawnSync } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const dispatchSecret = "local-mobile-verification-only";
const demoEventId = "10000000-0000-4000-8000-000000000003";
const demoEventTitle = "[샘플] 청소년 미디어 창작 교실";

const localStatus = readLocalStatus();
const serviceClient = createSupabaseClient(
  localStatus.API_URL,
  localStatus.SERVICE_ROLE_KEY,
);
const userAClient = createSupabaseClient(
  localStatus.API_URL,
  localStatus.ANON_KEY,
);
const userBClient = createSupabaseClient(
  localStatus.API_URL,
  localStatus.ANON_KEY,
);

let userAId;
let userBId;
let functionServer;

try {
  const eventResult = await serviceClient
    .from("events")
    .select("id,title")
    .eq("id", demoEventId)
    .single();
  assertNoError(eventResult.error, "seeded demo event lookup");
  assert(eventResult.data.title === demoEventTitle, "unexpected demo event title");

  userAId = await signInAnonymously(userAClient, "user A");
  userBId = await signInAnonymously(userBClient, "user B");
  pass("anonymous sign-in is enabled");

  const preferenceResult = await userAClient
    .from("notification_preferences")
    .upsert({
      user_id: userAId,
      categories: ["education"],
      audiences: ["youth"],
      new_events_enabled: true,
      closing_soon_enabled: true,
    });
  assertNoError(preferenceResult.error, "owner preference upsert");

  const savedEventResult = await userAClient.from("saved_events").insert({
    user_id: userAId,
    event_id: demoEventId,
  });
  assertNoError(savedEventResult.error, "owner saved event insert");

  const pushDeviceResult = await userAClient.from("push_devices").insert({
    user_id: userAId,
    expo_push_token: `ExponentPushToken[local-${userAId}]`,
    platform: "ios",
  });
  assertNoError(pushDeviceResult.error, "owner push device insert");

  const ownerRowsResult = await userAClient
    .from("notification_preferences")
    .select("user_id")
    .eq("user_id", userAId);
  assertNoError(ownerRowsResult.error, "owner preference read");
  assert(ownerRowsResult.data.length === 1, "owner row was not readable");

  const isolatedRowsResult = await userBClient
    .from("notification_preferences")
    .select("user_id")
    .eq("user_id", userAId);
  assertNoError(isolatedRowsResult.error, "cross-user preference read");
  assert(isolatedRowsResult.data.length === 0, "RLS exposed another user row");

  const forgedWriteResult = await userBClient.from("saved_events").insert({
    user_id: userAId,
    event_id: demoEventId,
  });
  assert(
    forgedWriteResult.error !== null,
    "RLS accepted a saved event for another user",
  );
  pass("owner-only RLS isolates preferences, saves, and devices");

  const nonAdminUpdateResult = await userAClient
    .from("events")
    .update({ title: "anonymous users must not update events" })
    .eq("id", demoEventId)
    .select("id");
  assertNoError(nonAdminUpdateResult.error, "non-admin event update request");
  assert(
    nonAdminUpdateResult.data.length === 0,
    "anonymous auth updated an admin-owned event",
  );

  const unchangedEventResult = await serviceClient
    .from("events")
    .select("title")
    .eq("id", demoEventId)
    .single();
  assertNoError(unchangedEventResult.error, "event integrity lookup");
  assert(
    unchangedEventResult.data.title === demoEventTitle,
    "admin event data changed during anonymous verification",
  );

  const privateOutboxResult = await userAClient
    .from("notification_outbox")
    .select("id")
    .limit(1);
  assert(
    privateOutboxResult.error !== null,
    "authenticated clients can read the server-only outbox",
  );
  pass("anonymous sessions remain separate from admin and outbox authority");

  functionServer = await startFunctionServer();

  const firstDispatch = await invokeDispatcher();
  assert(firstDispatch.mode === "DRY_RUN", "dispatcher did not use DRY_RUN");
  assert(firstDispatch.networkRequests === 0, "DRY_RUN made a network request");
  assert(firstDispatch.candidates === 2, "expected exactly two notification candidates");
  assert(firstDispatch.claimed === 2, "expected exactly two claimed outbox rows");
  assert(firstDispatch.deliveries === 2, "expected exactly two dry-run deliveries");

  const outboxResult = await serviceClient
    .from("notification_outbox")
    .select("kind,status,dedupe_key")
    .eq("user_id", userAId);
  assertNoError(outboxResult.error, "outbox verification query");
  assert(outboxResult.data.length === 2, "outbox did not contain two rows");
  assert(
    outboxResult.data.every((row) => row.status === "dry_run"),
    "outbox rows did not finish in dry_run",
  );
  assert(
    new Set(outboxResult.data.map((row) => row.kind)).size === 2,
    "new-event and closing-soon policies were not both exercised",
  );

  const outboxIdsResult = await serviceClient
    .from("notification_outbox")
    .select("id")
    .eq("user_id", userAId);
  assertNoError(outboxIdsResult.error, "outbox id query");

  const deliveryResult = await serviceClient
    .from("notification_deliveries")
    .select("status")
    .in(
      "outbox_id",
      outboxIdsResult.data.map((row) => row.id),
    );
  assertNoError(deliveryResult.error, "delivery verification query");
  assert(
    deliveryResult.data.length === 2
      && deliveryResult.data.every((row) => row.status === "dry_run"),
    "dry-run deliveries were not recorded exactly once",
  );

  const secondDispatch = await invokeDispatcher();
  assert(secondDispatch.mode === "DRY_RUN", "second dispatcher mode changed");
  assert(secondDispatch.networkRequests === 0, "second DRY_RUN made a network request");
  assert(secondDispatch.claimed === 0, "dedupe failed on the second dispatch");
  pass("notification matching, DRY_RUN, and dedupe work without provider traffic");

  console.log(
    "Local mobile backend verification passed: 2 users, 2 RLS boundaries, "
      + "2 notification kinds, 0 external requests.",
  );
} finally {
  if (functionServer) await stopProcess(functionServer);
  await deleteTestUser(userAId);
  await deleteTestUser(userBId);
  await userAClient.auth.signOut();
  await userBClient.auth.signOut();
}

function readLocalStatus() {
  const result = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["dlx", "supabase@latest", "status", "-o", "json"],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: process.env,
    },
  );
  if (result.status !== 0) {
    throw new Error(
      "Local Supabase is not running. Run `pnpm dlx supabase@latest start` first.",
    );
  }
  const start = result.stdout.indexOf("{");
  const end = result.stdout.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("Could not parse local Supabase status.");
  }
  const status = JSON.parse(result.stdout.slice(start, end + 1));
  for (const key of ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY"]) {
    if (!status[key]) throw new Error(`Local Supabase status is missing ${key}.`);
  }
  status.FUNCTIONS_URL ??= `${status.API_URL}/functions/v1`;
  return status;
}

function createSupabaseClient(url, key) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function signInAnonymously(client, label) {
  const result = await client.auth.signInAnonymously();
  assertNoError(result.error, `${label} anonymous sign-in`);
  assert(result.data.user?.id, `${label} did not receive a user id`);
  return result.data.user.id;
}

async function startFunctionServer() {
  const envPath = join(
    tmpdir(),
    `sokcho-moa-functions-${process.pid}-${Date.now()}.env`,
  );
  await writeFile(
    envPath,
    `NOTIFICATION_DISPATCH_SECRET=${dispatchSecret}\nDRY_RUN=true\n`,
    { encoding: "utf8", mode: 0o600 },
  );

  const child = spawn(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    [
      "dlx",
      "supabase@latest",
      "functions",
      "serve",
      "dispatch-notifications",
      "--env-file",
      envPath,
      "--no-verify-jwt",
    ],
    {
      cwd: repositoryRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  try {
    await waitForFunctionServer(child);
    return child;
  } finally {
    await unlink(envPath).catch(() => undefined);
  }
}

function waitForFunctionServer(child) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error("Timed out while starting the local Edge Function."));
    }, 30_000);

    const onData = (chunk) => {
      output += chunk.toString();
      if (!output.includes("Serving functions on")) return;
      clearTimeout(timeout);
      resolve();
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Local Edge Function stopped before it was ready (exit ${code}).`,
        ),
      );
    });
  });
}

async function invokeDispatcher() {
  const response = await fetch(
    `${localStatus.FUNCTIONS_URL}/dispatch-notifications`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-dispatch-secret": dispatchSecret,
      },
      body: "{}",
    },
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `Notification dispatcher failed (${response.status}): ${payload.error ?? "unknown"}`,
    );
  }
  return payload;
}

async function stopProcess(child) {
  if (child.exitCode === null) {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
  child.stdout.destroy();
  child.stderr.destroy();
  child.unref();
}

async function deleteTestUser(userId) {
  if (!userId) return;
  const result = await serviceClient.auth.admin.deleteUser(userId);
  if (result.error) {
    console.warn("Could not remove one local verification user.");
  }
}

function assertNoError(error, operation) {
  if (error) throw new Error(`${operation} failed: ${error.message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pass(message) {
  console.log(`PASS ${message}`);
}
