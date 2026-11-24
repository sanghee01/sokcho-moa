/** 공개한 항목이 하나도 없을 때 generateStaticParams가 대신 돌려주는 주소 값. 어느 목록에도 없는 값이라 페이지가 404로 그린다. */
export const EMPTY_STATIC_PARAM_VALUE = "none";

/**
 * cacheComponents는 generateStaticParams가 빈 배열을 돌려주면 빌드를 멈춘다(next/dist/build/static-paths/app.js의 empty-generate-static-params).
 * 공개한 공지·장소·행사가 하나도 없어도 배포가 되도록, 빈 목록이면 없는 주소 하나를 대신 돌려준다(2026-11-24).
 */
export function withEmptyStaticParam<Key extends string>(params: Record<Key, string>[], key: Key): Record<Key, string>[] {
  return params.length > 0 ? params : [{ [key]: EMPTY_STATIC_PARAM_VALUE } as Record<Key, string>];
}
