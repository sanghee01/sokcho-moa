/** URL 검색 값은 같은 이름이 여러 번 오면 배열이 된다(`?tab=a&tab=b`). 화면은 첫 값만 쓴다. */
export function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** URLSearchParams를 page의 searchParams와 같은 모양(같은 이름이 여러 번이면 배열)으로 바꾼다. proxy.ts가 페이지와 같은 함수로 주소를 계산할 때 쓴다. */
export function searchParamsToRecord(searchParams: URLSearchParams): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  for (const name of new Set(searchParams.keys())) {
    const values = searchParams.getAll(name);
    record[name] = values.length > 1 ? values : values[0];
  }
  return record;
}
