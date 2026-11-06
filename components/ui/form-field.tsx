import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import {
  formFieldErrorClassName,
  formFieldHelpTextClassName,
  formFieldLabelClassName,
  formFieldLabelNoteClassName,
} from "@/components/ui/form-styles";
import { iconProps } from "@/components/ui/icon";

/**
 * 입력 칸 하나의 라벨·도움말·오류(.ai/DESIGN.md 제보·의견 폼). 라벨은 입력창 위, 오류는 바로 아래에 둔다.
 * 필수 칸은 표시하지 않고 선택 칸에만 "(선택)"을 붙인다(2026-11-06 사용자 결정). 필수 여부는 입력창의 required로 전달된다.
 * 입력창에는 getFieldControlProps(id, …)를 펼쳐 도움말·오류와 연결한다.
 */
export function FormField({
  id,
  label,
  optional = false,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  help?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={formFieldLabelClassName}>
        {label}
        {optional && <span className={formFieldLabelNoteClassName}> (선택)</span>}
      </label>
      {children}
      {help && <p id={`${id}-help`} className={formFieldHelpTextClassName}>{help}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className={formFieldErrorClassName}>
          <CircleAlert {...iconProps} size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** 입력창에 붙일 속성. 도움말·오류 문장과 aria-describedby로 연결하고, 오류가 있으면 aria-invalid로 표시한다. */
export function getFieldControlProps(id: string, { hasHelp = false, error }: { hasHelp?: boolean; error?: string | null }) {
  const describedBy = [hasHelp ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  };
}
