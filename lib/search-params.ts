/** URL 검색 값은 같은 이름이 여러 번 오면 배열이 된다(`?tab=a&tab=b`). 화면은 첫 값만 쓴다. */
export function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
