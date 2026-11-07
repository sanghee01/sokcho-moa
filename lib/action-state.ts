import type { z } from "zod";

/**
 * `useActionState`로 쓰는 폼 action의 공통 반환 형태. 성공하면 error가 null이다.
 * fieldErrors는 칸(form 필드 이름)별 오류 문장이다. 화면은 해당 칸 바로 아래에 보여 준다(.ai/DESIGN.md 제보·의견 폼).
 */
export interface FormActionState {
  error: string | null;
  success: boolean;
  fieldErrors?: Partial<Record<string, string>>;
}

export const initialFormActionState: FormActionState = { error: null, success: false };

export function actionFailed(message: string): FormActionState {
  return { error: message, success: false };
}

/** 한 칸에 대한 실패(예: 첨부 사진 형식). 칸 아래와 요약에 같은 문장을 쓴다. */
export function fieldFailed(field: string, message: string): FormActionState {
  return { error: message, success: false, fieldErrors: { [field]: message } };
}

/** zod 검증 실패. 첫 오류 문장과 함께 칸마다 첫 오류 문장을 돌려준다. */
export function invalidFormInput(error: z.ZodError): FormActionState {
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return { error: firstIssueMessage(error), success: false, fieldErrors };
}

export function actionSucceeded(): FormActionState {
  return { error: null, success: true };
}

/** 관리자 폼은 성공하면 redirect하므로 실패 메시지만 돌려준다. */
export interface AdminActionState { error: string | null }

export const initialAdminActionState: AdminActionState = { error: null };

export function adminActionFailed(message: string): AdminActionState {
  return { error: message };
}

/** 관리자 폼 검증 실패 메시지. 어떤 칸이 틀렸는지 첫 번째 이유를 붙인다. */
export function invalidInput(error: z.ZodError): AdminActionState {
  const first = error.issues[0]?.message;
  return adminActionFailed(first ? `입력값을 확인해 주세요. ${first}` : "입력값을 확인해 주세요.");
}

/** zod 검증 실패 중 첫 번째 메시지를 사용자에게 보여 줄 문장으로 쓴다. */
export function firstIssueMessage(error: z.ZodError, fallback = "입력 내용을 확인해 주세요.") {
  return error.issues[0]?.message ?? fallback;
}

/**
 * 폼이 아닌 action(상태 변경·삭제 버튼)의 반환. 성공하면 error가 null이고 결과 값을 함께 담는다.
 * 예상한 실패는 throw하지 않고 돌려준다(Next.js 문서: throw는 예상하지 못한 오류에만 쓰고, 운영에서는 문구가 가려진다).
 */
export type ButtonActionResult<T extends object = object> = ({ error: null } & T) | { error: string };

/**
 * 버튼 action의 예상한 실패. 사용자에게는 정해 둔 문장만 돌려주고, DB 오류 원문은 서버 로그에만 남긴다.
 * 오류 원문에는 table·제약 이름 같은 내부 정보가 담긴다.
 */
export function buttonActionFailed(userMessage: string, cause?: { message: string } | null): { error: string } {
  if (cause) console.error(userMessage, cause.message);
  return { error: userMessage };
}
