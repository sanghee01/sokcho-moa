type FormControlType = "fileInput" | "input" | "textarea";

export const formContainerClassName =
  "space-y-6 rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-line sm:p-8";

export const formSuccessMessageClassName =
  "rounded-3xl border border-brand-200 bg-brand-50 p-6 text-brand-950 sm:p-8";

export const formFieldLabelClassName = "block text-sm font-bold text-content";

export const formFieldHelpTextClassName =
  "mt-2 block font-normal leading-6 text-content-subtle";

export const formFieldLabelNoteClassName = "font-normal text-content-subtle";

export const formErrorMessageClassName =
  "rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900 ring-1 ring-rose-200";

const formControlBaseClassName =
  "mt-2 w-full rounded-2xl border border-line-strong bg-surface text-sm font-normal";

const formControlClassNamesByType: Record<FormControlType, string> = {
  input:
    "px-4 py-3 text-content-strong placeholder:font-normal placeholder:text-content-placeholder",
  textarea:
    "resize-y px-4 py-3 leading-6 text-content-strong placeholder:font-normal placeholder:text-content-placeholder",
  fileInput:
    "block cursor-pointer px-3 py-2 text-content-muted file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand-800 hover:file:bg-brand-100 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
};

export function getFormControlClassName(type: FormControlType) {
  return `${formControlBaseClassName} ${formControlClassNamesByType[type]}`;
}
