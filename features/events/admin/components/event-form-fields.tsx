import type { ReactNode } from "react";

export const inputClassName = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5";
export const labelClassName = "text-sm font-bold text-slate-700";
export const sectionClassName = "space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6";

export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ml-1 text-rose-600">*</span>
      <span className="sr-only"> (필수)</span>
    </>
  );
}

export function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div>
      <h2 id={id} className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export function FieldHelp({ id, children, tone = "default" }: { id?: string; children: ReactNode; tone?: "default" | "warning" }) {
  return (
    <span id={id} className={`mt-1 block text-xs font-normal leading-5 ${tone === "warning" ? "text-rose-700" : "text-slate-500"}`}>
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
        <label className="text-xs font-medium text-slate-600">
          날짜
          <input required={requiredDate} type="date" name={name} defaultValue={parts.date} className={inputClassName} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          시간 (선택)
          <input type="time" name={`${name}Time`} defaultValue={parts.time} className={inputClassName} />
        </label>
      </div>
    </fieldset>
  );
}
