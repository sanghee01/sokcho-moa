import { describe, expect, it } from "vitest";
import { httpUrlSchema, isHttpUrl } from "@/lib/domain/url";

describe("HTTP URL boundary", () => {
  it.each(["http://example.com/event", "https://example.com/event"])("%s 주소를 허용한다", (url) => {
    expect(isHttpUrl(url)).toBe(true);
    expect(httpUrlSchema.safeParse(url).success).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/plain,hello",
    "file:///tmp/event",
    "ftp://example.com/event",
    "not-a-url",
  ])("%s 주소를 거부한다", (url) => {
    expect(isHttpUrl(url)).toBe(false);
    expect(httpUrlSchema.safeParse(url).success).toBe(false);
  });
});
