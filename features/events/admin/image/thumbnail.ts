// 지도 핀(scripts/backfill-event-image-thumbnails.mjs도 함께 씀)용 포스터 썸네일. Node가 바로 불러올 수 있게 다른 파일을 import하지 않는다.

/**
 * 지도 핀 액자는 안쪽 최대 68×86px(4:5)이고 포스터를 가득 채워(cover) 보인다. 3배 화면에서도 선명하도록
 * 240×300 상자를 덮는 크기(fit outside)로 줄인다. 세로 포스터는 폭 240px, 가로 포스터는 높이 300px이 된다.
 */
export const EVENT_IMAGE_THUMBNAIL_WIDTH_PX = 240;
const EVENT_IMAGE_THUMBNAIL_HEIGHT_PX = 300;
const EVENT_IMAGE_THUMBNAIL_QUALITY = 75;

export async function createEventImageThumbnail(input: ArrayBuffer | Uint8Array) {
  // optimize.ts와 같은 이유로 sharp는 썸네일을 만들 때만 불러온다.
  const { default: sharp } = await import("sharp");

  return sharp(input, { animated: false, failOn: "error" })
    .rotate()
    .resize({
      width: EVENT_IMAGE_THUMBNAIL_WIDTH_PX,
      height: EVENT_IMAGE_THUMBNAIL_HEIGHT_PX,
      fit: "outside",
      withoutEnlargement: true,
    })
    .webp({ quality: EVENT_IMAGE_THUMBNAIL_QUALITY, effort: 4 })
    .toBuffer();
}
