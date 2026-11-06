import type { ReactNode } from "react";

export const inputClassName = "mt-1 w-full rounded-control border border-line-input bg-surface px-3 py-2.5";
export const labelClassName = "text-label font-bold text-content";
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
      <h2 id={id} className="text-title-3 font-bold text-content-strong">{title}</h2>
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
      <legend className={labelClassName}>{labelText}{requiredDate && <RequiredMark />}</legend>
      <div className="mt-1 grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
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
