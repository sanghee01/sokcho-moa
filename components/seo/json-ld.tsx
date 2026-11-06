/**
 * 구조화 데이터(JSON-LD) script. JSON 안의 `<`를 escape해 데이터에 `</script>`가 들어 있어도
 * script가 일찍 닫히지 않게 한다(XSS 방지). 직접 dangerouslySetInnerHTML을 쓰지 않고 이 컴포넌트를 쓴다.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
