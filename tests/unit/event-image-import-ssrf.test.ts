import { beforeEach, describe, expect, it, vi } from "vitest";

// 수집 JSON의 imageUrl은 외부 데이터다. 서버가 내부망(메타데이터 서버, 로컬 서비스)에 요청하지 않게 막는다.
const dns = vi.hoisted(() => ({ addresses: [] as { address: string; family: number }[] }));

vi.mock("node:dns", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:dns")>();
  function lookup(_hostname: string, options: unknown, callback?: unknown) {
    const done = (typeof options === "function" ? options : callback) as (...args: unknown[]) => void;
    const all = typeof options === "object" && options !== null && (options as { all?: boolean }).all;
    if (all) done(null, dns.addresses);
    else done(null, dns.addresses[0]?.address, dns.addresses[0]?.family);
  }
  return { ...original, default: { ...original, lookup }, lookup };
});
vi.mock("node:dns/promises", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:dns/promises")>();
  async function lookup() {
    return dns.addresses;
  }
  return { ...original, default: { ...original, lookup }, lookup };
});

import { importOfficialEventImage, isBlockedAddress } from "@/features/events/admin/image-import";

const client = {} as never;

describe("포스터 이미지 가져오기의 내부망 차단", () => {
  beforeEach(() => {
    dns.addresses = [];
  });

  it.each([
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "0.0.0.0",
    "100.64.0.1", "198.18.0.1", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1", "::ffff:7f00:1",
  ])("%s는 내부 주소로 막는다", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(["8.8.8.8", "211.234.10.1", "2001:4860:4860::8888"])("%s는 공개 주소로 허용한다", (address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });

  it.each(["http://127.0.0.1/poster.jpg", "http://[::1]/poster.jpg", "http://100.64.0.1/poster.jpg"])(
    "IP를 직접 쓴 내부 주소 %s는 요청하지 않는다",
    async (url) => {
      const result = await importOfficialEventImage(client, url);
      expect(result.error).toContain("공개된 포스터");
    },
  );

  it("도메인이 내부 IP로 풀리면(DNS rebinding 포함) 연결하지 않는다", async () => {
    dns.addresses = [{ address: "10.0.0.5", family: 4 }];
    const result = await importOfficialEventImage(client, "https://poster.example.com/a.jpg");
    expect(result.error).toContain("공개된 포스터");
  });
});
