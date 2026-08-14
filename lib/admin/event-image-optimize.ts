import { EVENT_IMAGE_MAX_BYTES } from "@/lib/admin/event-image";

const MAX_INPUT_PIXELS = 40_000_000;
const MAX_WIDTH = 1_600;
const MAX_HEIGHT = 2_400;

export class EventImageOptimizationError extends Error {}

async function encodeWebp(input: ArrayBuffer | Uint8Array, quality: number, width: number) {
  // Load the native module only when an image is actually uploaded. Event saves
  // without a new image must not depend on Sharp's platform binary.
  const { default: sharp } = await import("sharp");

  return sharp(input, { animated: false, failOn: "error", limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width, height: MAX_HEIGHT, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

/** Converts approved poster inputs to a bounded WebP suitable for the public bucket. */
export async function optimizeEventImage(input: ArrayBuffer | Uint8Array) {
  try {
    const primary = await encodeWebp(input, 82, MAX_WIDTH);
    if (primary.byteLength <= EVENT_IMAGE_MAX_BYTES) return primary;

    const compact = await encodeWebp(input, 70, 1_200);
    if (compact.byteLength <= EVENT_IMAGE_MAX_BYTES) return compact;
  } catch {
    throw new EventImageOptimizationError("이미지를 읽거나 최적화하지 못했습니다. JPG, PNG 또는 WebP 파일인지 확인해 주세요.");
  }

  throw new EventImageOptimizationError("최적화한 이미지가 3MB를 넘습니다. 더 작은 원본을 사용해 주세요.");
}
