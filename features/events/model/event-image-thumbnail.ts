// 행사 포스터 썸네일의 이름 규칙. 원본 events/<id>.webp 옆에 events/<id>-thumb.webp로 저장한다.
// DB 열을 더하지 않고 원본 주소에서 썸네일 주소를 계산해, migration 없이 지도 핀이 작은 이미지를 쓰게 했다(2026-11-16 사용자 결정).
// 관리자 업로드(admin/image/storage.ts), 지도 핀(브라우저), backfill script(scripts/)가 함께 쓰므로 import 없는 순수 파일로 둔다.

export const EVENT_IMAGE_BUCKET = "event-images";
export const EVENT_IMAGE_PUBLIC_URL_MARKER = `/storage/v1/object/public/${EVENT_IMAGE_BUCKET}/`;

const THUMBNAIL_SUFFIX = "-thumb";
const ORIGINAL_PATH_PATTERN = /^(events\/[^/]+)\.webp$/;

/** 원본 경로(events/<id>.webp)의 썸네일 경로. 썸네일 자신이거나 규칙에 맞지 않는 경로면 null. */
export function getEventImageThumbnailPath(path: string) {
  const match = ORIGINAL_PATH_PATTERN.exec(path);
  if (!match || match[1].endsWith(THUMBNAIL_SUFFIX)) return null;
  return `${match[1]}${THUMBNAIL_SUFFIX}.webp`;
}

/** 우리 Storage에 올린 포스터 공개 URL이면 썸네일 공개 URL을, 외부 주소·빈 값이면 null을 돌려준다. */
export function getEventImageThumbnailUrl(url: string | null) {
  if (!url) return null;
  const index = url.indexOf(EVENT_IMAGE_PUBLIC_URL_MARKER);
  if (index < 0) return null;
  const base = url.slice(0, index + EVENT_IMAGE_PUBLIC_URL_MARKER.length);
  const thumbnailPath = getEventImageThumbnailPath(url.slice(base.length));
  return thumbnailPath ? `${base}${thumbnailPath}` : null;
}
