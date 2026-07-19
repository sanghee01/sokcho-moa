import { describe, expect, it } from "vitest";
import { createNaverMapsSdkUrl } from "@/lib/naver-map-sdk";

describe("createNaverMapsSdkUrl", () => {
  it("네이버 지도 v3 SDK에 공개 Client ID를 ncpKeyId로 전달한다", () => {
    const url = new URL(createNaverMapsSdkUrl("client id/+"));

    expect(url.origin).toBe("https://oapi.map.naver.com");
    expect(url.pathname).toBe("/openapi/v3/maps.js");
    expect(url.searchParams.get("ncpKeyId")).toBe("client id/+");
    expect(url.searchParams.has("clientId")).toBe(false);
  });
});
