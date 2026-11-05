import type { z } from "zod";

/** `useActionState`로 쓰는 폼 action의 공통 반환 형태. 성공하면 error가 null이다. */
export type FormActionState = { error: string | null; success: boolean };

export const initialFormActionState: FormActionState = { error: null, success: false };

export function actionFailed(message: string): FormActionState {
  return { error: message, success: false };
}

export function actionSucceeded(): FormActionState {
  return { error: null, success: true };
}

/** 관리자 폼은 성공하면 redirect하므로 실패 메시지만 돌려준다. */
export type AdminActionState = { error: string | null };

export function adminActionFailed(message: string): AdminActionState {
  return { error: message };
}

/** 관리자 폼 검증 실패 메시지. 어떤 칸이 틀렸는지 첫 번째 이유를 붙인다. */
export function invalidInput(error: z.ZodError): AdminActionState {
  const first = error.issues[0]?.message;
  return adminActionFailed(first ? `입력값을 확인해 주세요. ${first}` : "입력값을 확인해 주세요.");
}

export type EventImageUploadState = {
  error: string | null;
  publicUrl: string | null;
  uploadedPath: string | null;
  selectionToken: string | null;
  fileName: string | null;
};

/** zod 검증 실패 중 첫 번째 메시지를 사용자에게 보여 줄 문장으로 쓴다. */
export function firstIssueMessage(error: z.ZodError, fallback = "입력 내용을 확인해 주세요.") {
  return error.issues[0]?.message ?? fallback;
}

/**
 * 폼이 아닌 action(상태 변경·삭제 버튼)의 실패. 사용자에게는 정해 둔 문장만 보여 주고,
 * DB 오류 원문은 서버 로그에만 남긴다. 오류 원문에는 table·제약 이름 같은 내부 정보가 담긴다.
 */
export function throwActionError(userMessage: string, cause?: { message: string } | null): never {
  if (cause) console.error(userMessage, cause.message);
  throw new Error(userMessage);
}
