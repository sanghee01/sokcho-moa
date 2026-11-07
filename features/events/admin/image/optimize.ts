import { EVENT_IMAGE_MAX_BYTES, EVENT_IMAGE_MAX_MB } from "@/features/events/admin/image/rules";

const MAX_INPUT_PIXELS = 40_000_000;
const MAX_WIDTH = 1_600;
const MAX_HEIGHT = 2_400;

export class EventImageOptimizationError extends Error {}

async function encodeWebp(input: ArrayBuffer | Uint8Array, quality: number, width: number) {
  // 네이티브 모듈(sharp)은 실제로 이미지를 올릴 때만 불러온다. 새 이미지 없이 행사를 저장할 때는 플랫폼별 바이너리가 없어도 동작해야 한다.
  const { default: sharp } = await import("sharp");

  return sharp(input, { animated: false, failOn: "error", limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width, height: MAX_HEIGHT, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

/** 허용한 포스터 이미지를 공개 bucket에 맞는 크기의 WebP로 바꾼다. 처음 품질로 크기를 넘으면 한 번 더 줄여 본다. */
export async function optimizeEventImage(input: ArrayBuffer | Uint8Array) {
  try {
    const primary = await encodeWebp(input, 82, MAX_WIDTH);
    if (primary.byteLength <= EVENT_IMAGE_MAX_BYTES) return primary;

    const compact = await encodeWebp(input, 70, 1_200);
    if (compact.byteLength <= EVENT_IMAGE_MAX_BYTES) return compact;
  } catch (error) {
    console.error("Event image optimization failed", error);
    throw new EventImageOptimizationError("이미지를 읽거나 최적화하지 못했습니다. JPG, PNG 또는 WebP 파일인지 확인해 주세요.");
  }

  throw new EventImageOptimizationError(`최적화한 이미지가 ${EVENT_IMAGE_MAX_MB}MB를 넘습니다. 더 작은 원본을 사용해 주세요.`);
}
