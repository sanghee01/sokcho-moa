// 행사 대표 이미지 규칙의 원본. 업로드 칸(브라우저), 업로드 action, 공식 포스터 가져오기, 최적화 결과 검사가 모두 이 값을 쓴다.
// 예전에는 허용 형식 목록이 세 파일에, "3MB" 문구가 두 곳에 따로 있었다(2026-11-07).
export const EVENT_IMAGE_MAX_MB = 3;
export const EVENT_IMAGE_MAX_BYTES = EVENT_IMAGE_MAX_MB * 1024 * 1024;
export const EVENT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

const allowedEventImageTypes = new Set(EVENT_IMAGE_ACCEPT.split(","));

export function isAllowedEventImageType(type: string) {
  return allowedEventImageTypes.has(type);
}

export function validateEventImage(file: Pick<File, "size" | "type">) {
  if (!isAllowedEventImageType(file.type)) {
    return "지원하지 않는 파일 형식입니다. JPG, PNG, WebP 이미지를 선택해 주세요.";
  }
  if (file.size > EVENT_IMAGE_MAX_BYTES) {
    const sizeInMb = (file.size / 1024 / 1024).toFixed(1);
    return `선택한 파일은 ${sizeInMb}MB입니다. ${EVENT_IMAGE_MAX_MB}MB 이하 이미지를 선택해 주세요.`;
  }
  return null;
}
