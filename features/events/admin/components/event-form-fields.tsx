import type { ReactNode } from "react";
import { formFieldLabelClassName, getFormControlClassName } from "@/components/ui/form-styles";

// 입력창·라벨은 방문자 폼과 같은 공통 스타일을 쓴다(입력 글자 16px). 예전에는 관리자 폼마다 따로 만들어
// 입력창이 라벨의 14px·굵게를 물려받았다(iOS Safari는 16px보다 작은 입력창에 초점이 가면 화면을 확대함, 2026-11-07).
export const inputClassName = getFormControlClassName("input");
export const textareaClassName = getFormControlClassName("textarea");
export const labelClassName = formFieldLabelClassName;
export const sectionClassName = "space-y-5 rounded-card border border-line bg-surface-subtle p-4 sm:p-6";

export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ml-1 text-danger">*</span>
      <span className="sr-only"> (필수)</span>
    </>
  );
}

export function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div>
      <h2 id={id} className="text-title-3 text-content-strong">{title}</h2>
      <p className="mt-1 text-label leading-6 text-content-muted">{description}</p>
    </div>
  );
}

export function FieldHelp({ id, children, tone = "default" }: { id?: string; children: ReactNode; tone?: "default" | "warning" }) {
  return (
    <span id={id} className={`mt-1 block text-caption font-normal leading-5 ${tone === "warning" ? "text-danger" : "text-content-subtle"}`}>
      {children}
    </span>
  );
}

function dateTimeParts(value: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, time };
}

export function DateTimeField({
  labelText,
  name,
  defaultValue,
  requiredDate = false,
}: {
  labelText: string;
  name: string;
  defaultValue: string;
  requiredDate?: boolean;
}) {
  const parts = dateTimeParts(defaultValue);
  return (
    <fieldset className="min-w-0">
      <legend className={labelClassName}>{labelText}{Boolean(requiredDate) && <RequiredMark />}</legend>
      {/* 입력 글자가 16px이라 768px에서 날짜와 시간을 나란히 두면 날짜가 잘린다. lg 미만에서는 위아래로 쌓는다(2026-11-07). */}
      <div className="mt-1 grid gap-2 lg:grid-cols-[minmax(0,1fr)_9rem]">
        <label className="text-caption font-medium text-content-muted">
          날짜
          <input required={requiredDate} type="date" name={name} defaultValue={parts.date} className={inputClassName} />
        </label>
        <label className="text-caption font-medium text-content-muted">
          시간 (선택)
          <input type="time" name={`${name}Time`} defaultValue={parts.time} className={inputClassName} />
        </label>
      </div>
    </fieldset>
  );
}
