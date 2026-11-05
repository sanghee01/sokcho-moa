export const EVENT_IMAGE_MAX_MB = 3;
export const EVENT_IMAGE_MAX_BYTES = EVENT_IMAGE_MAX_MB * 1024 * 1024;
export const EVENT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

const allowedEventImageTypes = new Set(EVENT_IMAGE_ACCEPT.split(","));

export function validateEventImage(file: Pick<File, "size" | "type">) {
  if (!allowedEventImageTypes.has(file.type)) {
    return "지원하지 않는 파일 형식입니다. JPG, PNG, WebP 이미지를 선택해 주세요.";
  }
  if (file.size > EVENT_IMAGE_MAX_BYTES) {
    const sizeInMb = (file.size / 1024 / 1024).toFixed(1);
    return `선택한 파일은 ${sizeInMb}MB입니다. ${EVENT_IMAGE_MAX_MB}MB 이하 이미지를 선택해 주세요.`;
  }
  return null;
}
