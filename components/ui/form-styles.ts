// 폼 배치는 디자인 개편 5단계에서 바꾼다. 여기서는 색·모서리·글자 크기만 .ai/DESIGN.md 토큰으로 맞춘다.
type FormControlType = "fileInput" | "input" | "textarea";

export const formContainerClassName =
  "space-y-6 rounded-card bg-surface p-5 ring-1 ring-line sm:p-8";

export const formSuccessMessageClassName =
  "rounded-card border border-line bg-primary-subtle p-6 text-content-strong sm:p-8";

export const formFieldLabelClassName = "block text-label font-semibold text-content-strong";

export const formFieldHelpTextClassName =
  "mt-2 block font-normal leading-6 text-content-subtle";

export const formFieldLabelNoteClassName = "font-normal text-content-subtle";

export const formErrorMessageClassName =
  "rounded-control bg-danger-subtle px-4 py-3 text-label font-semibold text-danger";

// 입력 글자는 16px(text-body)이다. iOS Safari는 16px보다 작은 입력창에 초점이 가면 화면을 확대한다.
const formControlBaseClassName =
  "mt-2 w-full rounded-control border border-line-input bg-surface text-body font-normal";

const formControlClassNamesByType: Record<FormControlType, string> = {
  input:
    "min-h-12 px-4 py-2.5 text-content-strong placeholder:font-normal placeholder:text-content-placeholder",
  textarea:
    "resize-y px-4 py-3 text-content-strong placeholder:font-normal placeholder:text-content-placeholder",
  fileInput:
    "block cursor-pointer px-3 py-2 text-content-muted file:mr-3 file:rounded-control file:border-0 file:bg-primary-subtle file:px-4 file:py-2 file:text-label file:font-semibold file:text-primary-text hover:file:bg-surface-muted disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
};

export function getFormControlClassName(type: FormControlType) {
  return `${formControlBaseClassName} ${formControlClassNamesByType[type]}`;
}
