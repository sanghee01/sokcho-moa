import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/json-ld";

describe("JsonLd", () => {
  it("데이터에 </script>가 들어 있어도 script를 일찍 닫지 않고, 파싱하면 원래 값이 나온다", () => {
    const data = { name: "</script><script>alert(1)</script>" };
    const html = renderToStaticMarkup(createElement(JsonLd, { data }));

    // 여는 태그 하나와 닫는 태그 하나만 있어야 한다.
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html.match(/<\/script>/g)).toHaveLength(1);

    const json = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(JSON.parse(json)).toEqual(data);
  });
});
