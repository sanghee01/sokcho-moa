// 폼 규칙의 원본은 .ai/DESIGN.md의 "제보·의견 폼"이다: 한 열, 최대 폭 40rem, 라벨은 입력창 위, 입력 높이 48px, 오류는 해당 칸 바로 아래.
type FormControlType = "fileInput" | "input" | "textarea";

/** 폼은 카드로 감싸지 않고 평평하게 둔다(2026-11-06 사용자 결정). */
export const formContainerClassName = "space-y-6";

export const formSuccessMessageClassName = "rounded-card bg-primary-subtle p-6 text-content-strong";

export const formFieldLabelClassName = "block text-label font-semibold text-content-strong";

export const formFieldHelpTextClassName = "mt-2 text-label font-normal text-content-subtle";

export const formFieldLabelNoteClassName = "font-normal text-content-subtle";

/** 칸 바로 아래 오류 문장 */
export const formFieldErrorClassName = "mt-2 flex items-start gap-1.5 text-label font-medium text-danger";

/** 칸과 관계없는 오류(요청 제한, 저장 실패). 제출 버튼 바로 위에 둔다. */
export const formErrorMessageClassName =
  "rounded-control bg-danger-subtle px-4 py-3 text-label font-semibold text-danger";

// 입력 글자는 16px(text-body)이다. iOS Safari는 16px보다 작은 입력창에 초점이 가면 화면을 확대한다.
const formControlBaseClassName =
  "mt-2 w-full rounded-control border border-line-input bg-surface text-body font-normal aria-invalid:border-danger";

const formControlClassNamesByType: Record<FormControlType, string> = {
  input:
    "min-h-12 px-4 py-2.5 text-content-strong placeholder:font-normal placeholder:text-content-placeholder",
  textarea:
    "resize-y px-4 py-3 text-content-strong placeholder:font-normal placeholder:text-content-placeholder",
  fileInput:
    "block min-h-12 cursor-pointer px-3 py-2 text-content-muted file:mr-3 file:rounded-control file:border-0 file:bg-primary-subtle file:px-4 file:py-2 file:text-label file:font-semibold file:text-primary-text hover:file:bg-surface-muted disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
};

export function getFormControlClassName(type: FormControlType) {
  return `${formControlBaseClassName} ${formControlClassNamesByType[type]}`;
}
