import { createClient } from "npm:@supabase/supabase-js@2.110.7";
import {
  createNotificationCandidates,
  isDryRun,
  type NotificationCandidate,
  type NotificationEvent,
  type NotificationPreference,
  type SavedEventReference,
} from "../_shared/notification-policy.ts";

type OutboxRow = {
  id: string;
  user_id: string;
  event_id: string;
  kind: "new_event" | "closing_soon";
  title: string;
  body: string;
  data: Record<string, unknown>;
};

type PushDeviceRow = {
  id: string;
  user_id: string;
  expo_push_token: string;
};

type DeliveryPair = {
  outbox: OutboxRow;
  device: PushDeviceRow;
};

type DeliveryResult = {
  outboxId: string;
  deviceId: string;
  status: "sent" | "failed";
  providerMessageId: string | null;
  errorCode: string | null;
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const dispatchSecret = Deno.env.get("NOTIFICATION_DISPATCH_SECRET");
  if (
    !dispatchSecret
    || !secretsMatch(request.headers.get("x-dispatch-secret"), dispatchSecret)
  ) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const supabase = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const now = new Date();
    const dryRun = isDryRun(Deno.env.get("DRY_RUN"));

    const [preferencesResult, eventsResult, savedEventsResult] = await Promise.all([
      supabase
        .from("notification_preferences")
        .select(
          "user_id,categories,audiences,new_events_enabled,closing_soon_enabled",
        )
        .or("new_events_enabled.eq.true,closing_soon_enabled.eq.true"),
      supabase
        .from("events")
        .select(
          "id,slug,title,category,audiences,review_status,published_at,application_end_at",
        )
        .eq("review_status", "published"),
      supabase.from("saved_events").select("user_id,event_id"),
    ]);
    assertNoError(preferencesResult.error, "notification preferences query");
    assertNoError(eventsResult.error, "events query");
    assertNoError(savedEventsResult.error, "saved events query");

    const candidates = createNotificationCandidates({
      preferences: (preferencesResult.data ?? []).map(mapPreference),
      events: (eventsResult.data ?? []).map(mapEvent),
      savedEvents: (savedEventsResult.data ?? []).map(mapSavedEvent),
      now,
    });
    await insertCandidates(supabase, candidates);

    const claimId = crypto.randomUUID();
    const claimResult = await supabase.rpc("claim_notification_outbox", {
      p_batch_limit: 100,
      p_claim_id: claimId,
    });
    assertNoError(claimResult.error, "notification outbox claim");
    const claimed = (claimResult.data ?? []) as OutboxRow[];

    const devices = await loadActiveDevices(
      supabase,
      [...new Set(claimed.map((outbox) => outbox.user_id))],
    );
    const pairs = pairOutboxWithDevices(claimed, devices);

    if (dryRun) {
      await recordDryRun(supabase, claimed, pairs, now);
      return json({
        mode: "DRY_RUN",
        networkRequests: 0,
        candidates: candidates.length,
        claimed: claimed.length,
        deliveries: pairs.length,
      });
    }

    const results = await dispatchLive(supabase, claimed, pairs, now);
    return json({
      mode: "LIVE",
      candidates: candidates.length,
      claimed: claimed.length,
      sent: results.filter((result) => result.status === "sent").length,
      failed: results.filter((result) => result.status === "failed").length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return json({ error: "dispatch_failed", message }, 500);
  }
});

async function insertCandidates(
  supabase: ReturnType<typeof createClient>,
  candidates: NotificationCandidate[],
) {
  if (candidates.length === 0) return;
  const result = await supabase.from("notification_outbox").upsert(
    candidates.map((candidate) => ({
      user_id: candidate.userId,
      event_id: candidate.eventId,
      kind: candidate.kind,
      dedupe_key: candidate.dedupeKey,
      title: candidate.title,
      body: candidate.body,
      data: candidate.data,
      scheduled_for: candidate.scheduledFor,
    })),
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  assertNoError(result.error, "notification outbox insert");
}

async function loadActiveDevices(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
) {
  if (userIds.length === 0) return [];
  const result = await supabase
    .from("push_devices")
    .select("id,user_id,expo_push_token")
    .in("user_id", userIds)
    .eq("enabled", true)
    .is("invalidated_at", null);
  assertNoError(result.error, "push devices query");
  return (result.data ?? []) as PushDeviceRow[];
}

function pairOutboxWithDevices(
  outboxRows: OutboxRow[],
  devices: PushDeviceRow[],
) {
  const devicesByUser = new Map<string, PushDeviceRow[]>();
  for (const device of devices) {
    const userDevices = devicesByUser.get(device.user_id) ?? [];
    userDevices.push(device);
    devicesByUser.set(device.user_id, userDevices);
  }
  return outboxRows.flatMap((outbox) => (
    (devicesByUser.get(outbox.user_id) ?? []).map((device) => ({
      outbox,
      device,
    }))
  ));
}

async function recordDryRun(
  supabase: ReturnType<typeof createClient>,
  claimed: OutboxRow[],
  pairs: DeliveryPair[],
  now: Date,
) {
  if (pairs.length > 0) {
    const deliveryResult = await supabase.from("notification_deliveries").upsert(
      pairs.map(({ outbox, device }) => ({
        outbox_id: outbox.id,
        device_id: device.id,
        status: "dry_run",
        attempted_at: now.toISOString(),
      })),
      { onConflict: "outbox_id,device_id" },
    );
    assertNoError(deliveryResult.error, "dry-run delivery record");
  }
  if (claimed.length === 0) return;
  const outboxResult = await supabase
    .from("notification_outbox")
    .update({
      status: "dry_run",
      processed_at: now.toISOString(),
      lock_id: null,
      locked_at: null,
    })
    .in("id", claimed.map((outbox) => outbox.id));
  assertNoError(outboxResult.error, "dry-run outbox update");
}

async function dispatchLive(
  supabase: ReturnType<typeof createClient>,
  claimed: OutboxRow[],
  pairs: DeliveryPair[],
  now: Date,
) {
  const alreadySent = await loadSentDeliveryKeys(
    supabase,
    claimed.map((outbox) => outbox.id),
  );
  const pendingPairs = pairs.filter(({ outbox, device }) => (
    !alreadySent.has(deliveryKey(outbox.id, device.id))
  ));

  if (pendingPairs.length > 0) {
    const processingResult = await supabase.from("notification_deliveries").upsert(
      pendingPairs.map(({ outbox, device }) => ({
        outbox_id: outbox.id,
        device_id: device.id,
        status: "processing",
        attempted_at: now.toISOString(),
      })),
      { onConflict: "outbox_id,device_id" },
    );
    assertNoError(processingResult.error, "processing delivery record");
  }

  const results: DeliveryResult[] = pairs
    .filter(({ outbox, device }) => alreadySent.has(deliveryKey(outbox.id, device.id)))
    .map(({ outbox, device }) => ({
      outboxId: outbox.id,
      deviceId: device.id,
      status: "sent",
      providerMessageId: null,
      errorCode: null,
    }));

  for (const pairChunk of chunks(pendingPairs, 100)) {
    const tickets = await sendExpoMessages(pairChunk);
    pairChunk.forEach((pair, index) => {
      const ticket = tickets[index] ?? {
        status: "error",
        details: { error: "MissingProviderTicket" },
      };
      results.push({
        outboxId: pair.outbox.id,
        deviceId: pair.device.id,
        status: ticket.status === "ok" ? "sent" : "failed",
        providerMessageId: ticket.id ?? null,
        errorCode: ticket.details?.error ?? null,
      });
    });
  }

  if (results.length > 0) {
    const deliveryResult = await supabase.from("notification_deliveries").upsert(
      results.map((result) => ({
        outbox_id: result.outboxId,
        device_id: result.deviceId,
        status: result.status,
        provider_message_id: result.providerMessageId,
        error_code: result.errorCode,
        attempted_at: now.toISOString(),
      })),
      { onConflict: "outbox_id,device_id" },
    );
    assertNoError(deliveryResult.error, "delivery result update");
  }

  const invalidDeviceIds = results
    .filter((result) => result.errorCode === "DeviceNotRegistered")
    .map((result) => result.deviceId);
  if (invalidDeviceIds.length > 0) {
    const invalidationResult = await supabase
      .from("push_devices")
      .update({ enabled: false, invalidated_at: now.toISOString() })
      .in("id", invalidDeviceIds);
    assertNoError(invalidationResult.error, "push device invalidation");
  }

  await updateOutboxResults(supabase, claimed, pairs, results, now);
  return results;
}

async function loadSentDeliveryKeys(
  supabase: ReturnType<typeof createClient>,
  outboxIds: string[],
) {
  if (outboxIds.length === 0) return new Set<string>();
  const result = await supabase
    .from("notification_deliveries")
    .select("outbox_id,device_id")
    .in("outbox_id", outboxIds)
    .eq("status", "sent");
  assertNoError(result.error, "sent delivery query");
  return new Set(
    (result.data ?? []).map((row) => deliveryKey(row.outbox_id, row.device_id)),
  );
}

async function sendExpoMessages(pairs: DeliveryPair[]) {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  const accessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(pairs.map(({ outbox, device }) => ({
        to: device.expo_push_token,
        sound: "default",
        title: outbox.title,
        body: outbox.body,
        data: outbox.data,
      }))),
    });
    if (!response.ok) {
      return pairs.map((): ExpoTicket => ({
        status: "error",
        details: { error: `ExpoHttp${response.status}` },
      }));
    }
    const payload = await response.json() as { data?: ExpoTicket[] };
    return payload.data ?? [];
  } catch {
    return pairs.map((): ExpoTicket => ({
      status: "error",
      details: { error: "ExpoNetworkError" },
    }));
  }
}

async function updateOutboxResults(
  supabase: ReturnType<typeof createClient>,
  claimed: OutboxRow[],
  pairs: DeliveryPair[],
  results: DeliveryResult[],
  now: Date,
) {
  for (const outbox of claimed) {
    const pairCount = pairs.filter((pair) => pair.outbox.id === outbox.id).length;
    const outboxResults = results.filter((result) => result.outboxId === outbox.id);
    const status = pairCount === 0
      ? "skipped"
      : outboxResults.some((result) => result.status === "sent")
        ? "sent"
        : "failed";
    const updateResult = await supabase
      .from("notification_outbox")
      .update({
        status,
        processed_at: now.toISOString(),
        lock_id: null,
        locked_at: null,
        last_error: status === "failed" ? "all device deliveries failed" : null,
      })
      .eq("id", outbox.id);
    assertNoError(updateResult.error, "outbox result update");
  }
}

function mapPreference(row: Record<string, unknown>): NotificationPreference {
  return {
    userId: String(row.user_id),
    categories: stringArray(row.categories),
    audiences: stringArray(row.audiences),
    newEventsEnabled: row.new_events_enabled === true,
    closingSoonEnabled: row.closing_soon_enabled === true,
  };
}

function mapEvent(row: Record<string, unknown>): NotificationEvent {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: String(row.category),
    audiences: stringArray(row.audiences),
    reviewStatus: row.review_status === "published" ? "published" : "pending",
    publishedAt: nullableString(row.published_at),
    applicationEndAt: nullableString(row.application_end_at),
  };
}

function mapSavedEvent(row: Record<string, unknown>): SavedEventReference {
  return {
    userId: String(row.user_id),
    eventId: String(row.event_id),
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function deliveryKey(outboxId: string, deviceId: string) {
  return `${outboxId}:${deviceId}`;
}

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function assertNoError(
  error: { message: string } | null,
  operation: string,
) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function secretsMatch(provided: string | null, expected: string) {
  if (!provided || provided.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < provided.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: jsonHeaders });
}
