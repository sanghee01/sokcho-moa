import "server-only";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { Readable } from "node:stream";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_IMAGE_MAX_BYTES } from "@/features/events/admin/image-rules";
import { EventImageOptimizationError, optimizeEventImage } from "@/features/events/admin/image-optimize";
import { uploadEventImageBuffer } from "@/features/events/admin/image-storage";

const MAX_REMOTE_IMAGE_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;
const imageContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const NOT_PUBLIC_MESSAGE = "공개된 포스터 이미지 URL만 가져올 수 있습니다.";

/** 공개 인터넷이 아닌 대역(IANA special-purpose). 서버가 내부망·클라우드 메타데이터에 요청하지 않게 막는다. */
const blockedRanges = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3],
] as const) blockedRanges.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["::", 127], ["64:ff9b::", 96], ["100::", 64], ["2001:db8::", 32], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) blockedRanges.addSubnet(network, prefix, "ipv6");

/** IPv4-mapped IPv6(::ffff:a.b.c.d 또는 ::ffff:7f00:1)는 IPv4 주소로 바꿔 검사한다. */
function mappedIpv4(address: string) {
  const match = /^::ffff:(?:(\d+\.\d+\.\d+\.\d+)|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/i.exec(address);
  if (!match) return null;
  if (match[1]) return match[1];
  const high = Number.parseInt(match[2], 16);
  const low = Number.parseInt(match[3], 16);
  return [high >> 8, high & 255, low >> 8, low & 255].join(".");
}

export function isBlockedAddress(address: string) {
  const ipv4 = mappedIpv4(address.toLowerCase());
  if (ipv4) return blockedRanges.check(ipv4, "ipv4");
  const family = isIP(address);
  if (family === 0) return true;
  return blockedRanges.check(address, family === 4 ? "ipv4" : "ipv6");
}

class BlockedAddressError extends Error {
  constructor() {
    super(NOT_PUBLIC_MESSAGE);
  }
}

/**
 * 연결하는 순간의 DNS 결과를 검사한다. 미리 한 번 확인하고 fetch가 다시 조회하면, 그 사이 DNS 응답을
 * 내부 IP로 바꾸는 공격(DNS rebinding)에 뚫린다. 그래서 실제 연결에 쓰는 lookup 자체에서 막는다.
 */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 4);
    const list = addresses as unknown as LookupAddress[];
    if (list.length === 0 || list.some(({ address }) => isBlockedAddress(address))) {
      return callback(new BlockedAddressError(), "", 4);
    }
    if (options.all) return (callback as unknown as (error: null, addresses: LookupAddress[]) => void)(null, list);
    return callback(null, list[0].address, list[0].family);
  });
};

function assertPublicImageUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("포스터 이미지 URL 형식을 확인해 주세요.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("포스터 이미지는 HTTP(S) URL만 가져올 수 있습니다.");
  if (url.username || url.password || url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
    throw new Error(NOT_PUBLIC_MESSAGE);
  }
  // IP를 직접 쓴 주소는 DNS 조회 없이 연결되므로 여기서 검사한다.
  const literal = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(literal) && isBlockedAddress(literal)) throw new Error(NOT_PUBLIC_MESSAGE);
  return url;
}

/** publicOnlyLookup으로 연결하는 GET. 리디렉션은 따라가지 않고 그대로 돌려준다. */
function requestPublicUrl(url: URL) {
  const transport = url.protocol === "https:" ? https : http;
  return new Promise<Response>((resolve, reject) => {
    const request = transport.request(url, {
      method: "GET",
      lookup: publicOnlyLookup,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "image/avif,image/webp,image/png,image/jpeg;q=0.9,*/*;q=0.1" },
    }, (incoming) => {
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
        else if (value !== undefined) headers.set(name, value);
      }
      const status = incoming.statusCode ?? 500;
      const body = status >= 300 && status < 400 ? null : (Readable.toWeb(incoming) as ReadableStream<Uint8Array>);
      if (!body) incoming.resume();
      resolve(new Response(body, { status, headers }));
    });
    request.on("error", (error) => reject(error instanceof BlockedAddressError || error.cause instanceof BlockedAddressError
      ? new Error(NOT_PUBLIC_MESSAGE)
      : error));
    request.end();
  });
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
  let url = assertPublicImageUrl(imageUrl);
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await requestPublicUrl(url);
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) throw new Error("포스터 이미지의 리디렉션 주소를 확인하지 못했습니다.");
      url = assertPublicImageUrl(new URL(location, url).toString());
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
