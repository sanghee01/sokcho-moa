import { z } from "zod";

/**
 * 행사·명소 공개 URL에 쓰는 slug 규칙: 영문 소문자·숫자를 하이픈 하나로 잇는다.
 * HTML `pattern` 속성은 전체 일치를 전제로 하므로 앞뒤 기호 없는 원본도 함께 둔다.
 */
export const SLUG_PATTERN_SOURCE = "[a-z0-9]+(?:-[a-z0-9]+)*";
export const slugPattern = new RegExp(`^${SLUG_PATTERN_SOURCE}$`);
export const slugSchema = z.string().regex(slugPattern, "영문 소문자·숫자·하이픈만 사용하세요.");
