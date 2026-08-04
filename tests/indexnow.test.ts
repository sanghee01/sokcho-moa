import { describe, expect, it } from "vitest";
import { GET as getIndexNowKey } from "@/app/indexnow-key.txt/route";
import {
  buildIndexNowPayload,
  buildPublicEventIndexPaths,
  INDEXNOW_KEY,
} from "@/lib/seo/indexnow";

describe("IndexNow", () => {
  it("행사 공개 URL을 이전·현재 카테고리까지 중복 없이 만든다", () => {
    expect(buildPublicEventIndexPaths("summer-concert", [
      "festival",
      "festival",
      "performance",
      "invalid-category",
      null,
    ])).toEqual([
      "/",
      "/events/summer-concert",
      "/topics/festival",
      "/topics/performance",
    ]);
  });

  it("같은 사이트의 변경 URL만 중복 없이 네이버 요청 형식으로 만든다", () => {
    const payload = buildIndexNowPayload([
      "/",
      "/events/summer-concert",
      "/events/summer-concert",
      "https://other.example/events/not-ours",
    ], "https://sokcho-moa.vercel.app/preview");

    expect(payload).toEqual({
      host: "sokcho-moa.vercel.app",
      key: INDEXNOW_KEY,
      keyLocation: "https://sokcho-moa.vercel.app/indexnow-key.txt",
      urlList: [
        "https://sokcho-moa.vercel.app/",
        "https://sokcho-moa.vercel.app/events/summer-concert",
      ],
    });
  });

  it("검색엔진이 확인할 수 있는 공개 키 문서를 제공한다", async () => {
    const response = getIndexNowKey();

    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toBe(INDEXNOW_KEY);
  });
});
