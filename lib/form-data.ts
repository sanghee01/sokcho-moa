import { z } from "zod";
import { createHttpUrlSchema } from "@/lib/url";

/** FormData 값 중 문자열만 꺼낸다. 파일이거나 없으면 빈 문자열. */
export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** 비워 둘 수 있는 글 입력. 공백만 있으면 null로 저장한다. */
export const optionalTextField = z.string().trim().transform((value) => value || null);

const httpUrlField = createHttpUrlSchema({
  invalidUrl: "올바른 URL을 입력하세요.",
  unsupportedProtocol: "올바른 URL을 입력하세요.",
});

/** 비워 둘 수 있는 http(s) URL 입력. 비어 있으면 null. */
export const optionalUrlField = z.string().trim().transform((value, context) => {
  if (!value) return null;
  const parsed = httpUrlField.safeParse(value);
  if (!parsed.success) {
    context.addIssue({ code: "custom", message: "올바른 URL을 입력하세요." });
    return z.NEVER;
  }
  return parsed.data;
});
