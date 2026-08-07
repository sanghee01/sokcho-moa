import { lookup } from "node:dns/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_IMAGE_MAX_BYTES } from "@/lib/admin/event-image";
import { EventImageOptimizationError, optimizeEventImage } from "@/lib/admin/event-image-optimize";
import { uploadEventImageBuffer } from "@/lib/actions/admin/event-image-storage";

const MAX_REMOTE_IMAGE_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;
const imageContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function isPrivateIpAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) return isPrivateIpAddress(normalized.slice(7));
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("ff")) return true;

  const parts = normalized.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  const [first, second] = parts;
  return first === 0
    || first === 10
    || first === 127
    || first === 169 && second === 254
    || first === 172 && second >= 16 && second <= 31
    || first === 192 && second === 168
    || first >= 224;
}

async function assertPublicImageUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("포스터 이미지 URL 형식을 확인해 주세요.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("포스터 이미지는 HTTP(S) URL만 가져올 수 있습니다.");
  if (url.username || url.password || url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
    throw new Error("공개된 포스터 이미지 URL만 가져올 수 있습니다.");
  }

  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIpAddress(address))) {
      throw new Error("공개된 포스터 이미지 URL만 가져올 수 있습니다.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("공개된 포스터")) throw error;
    throw new Error("포스터 이미지 서버의 공개 주소를 확인하지 못했습니다.");
  }

  return url;
}

async function readLimitedBody(response: Response) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error("원본 포스터가 12MB를 넘습니다. 더 작은 공식 이미지를 사용해 주세요.");
  }
  if (!response.body) throw new Error("포스터 이미지 응답 본문이 없습니다.");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REMOTE_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error("원본 포스터가 12MB를 넘습니다. 더 작은 공식 이미지를 사용해 주세요.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function downloadOfficialImage(imageUrl: string) {
  let url = await assertPublicImageUrl(imageUrl);
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "image/avif,image/webp,image/png,image/jpeg;q=0.9,*/*;q=0.1" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) throw new Error("포스터 이미지의 리디렉션 주소를 확인하지 못했습니다.");
      url = await assertPublicImageUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`포스터 이미지를 가져오지 못했습니다. (HTTP ${response.status})`);

    const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.toLowerCase();
    if (!contentType || !imageContentTypes.has(contentType)) {
      throw new Error("JPG, PNG 또는 WebP 포스터 이미지만 가져올 수 있습니다.");
    }
    return readLimitedBody(response);
  }
  throw new Error("포스터 이미지의 리디렉션이 너무 많습니다.");
}

export async function importOfficialEventImage(client: SupabaseClient, imageUrl: string) {
  try {
    const source = await downloadOfficialImage(imageUrl);
    const optimized = await optimizeEventImage(source);
    if (optimized.byteLength > EVENT_IMAGE_MAX_BYTES) throw new EventImageOptimizationError("최적화한 이미지가 3MB를 넘습니다.");
    return await uploadEventImageBuffer(client, optimized);
  } catch (error) {
    return {
      image: null,
      error: error instanceof Error ? error.message : "포스터 이미지를 최적화해 저장하지 못했습니다.",
    };
  }
}
