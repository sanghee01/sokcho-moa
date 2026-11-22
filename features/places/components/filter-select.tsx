import { ChevronDown } from "lucide-react";
import type { ChangeEvent } from "react";

/**
 * 칩 줄 옆에 두는 작은 고르기 칸(.ai/DESIGN.md FilterSelect). 가볼만한 곳 지역(전체 지역 · 속초 · 고성 · 양양)이 쓴다.
 * 가볼만한 곳(목록·검색)만 쓰므로 features/places에 둔다. 지도에서 지역 select를 뺀 뒤(2026-11-22) 공통 부품(components/ui)에서 옮겼다.
 * 지역 칩 줄을 따로 두면 분류 칩과 칩이 두 줄이 되어 정신없어 보여 select 하나로 바꿨다(2026-11-22 사용자 결정).
 * 모양은 분류 칩(FilterChip)과 같은 36px 알약 테두리이고, 누르는 높이는 44px이다. 브라우저 기본 화살표 대신 아이콘을 그린다.
 * 칩과 구분되게 글자를 굵게 하고 아래 화살표를 둔다(2026-11-22 사용자 결정: A안).
 * 글자는 칩(14px)보다 큰 16px(text-body)이다. iOS Safari는 16px보다 작은 입력칸에 초점이 가면 화면을 확대한다(DESIGN.md 입력창 규칙, 2026-11-22 리뷰). 알약 크기는 좌우 여백을 줄여 맞춘다. 칩 줄과 사이의 세로 구분선은 쓰는 쪽이 둔다(filterSelectDividerClassName).
 * 화면에 라벨을 두지 않고 화면 읽기용 이름(label)만 둔다. 고른 값("전체 지역", "고성")이 곧 무엇을 고르는 칸인지 말해 준다.
 */
export function FilterSelect({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name?: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  // 바뀔 때 할 일이 없으면(스크립트 없는 GET 폼) 처음 값만 정하고 브라우저에 맡긴다.
  const valueProps = onChange === undefined ? { defaultValue: value } : { value, onChange };
  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";
  return (
    // 누르는 영역(select)은 44px이고, 보이는 알약은 옆 칩과 같은 36px이다. 알약은 select 뒤에 깐 칸이 그리고 select는 투명하다.
    // 폭은 고른 보기의 글자에 맞춘다. select는 가장 긴 보기("전체 지역")에 폭을 맞춰 "속초"일 때 오른쪽이 비어 보였다(2026-11-22).
    // 그래서 보이지 않는 같은 글자(FILTER_SELECT_LABEL_ATTRIBUTE)로 칸 폭을 잡고 select는 그 칸을 덮는다.
    <span className="group relative inline-flex h-11 shrink-0 items-center">
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1 bottom-1 rounded-full bg-surface ring-1 ring-inset ring-line-strong group-hover:bg-surface-subtle" />
      <span aria-hidden="true" {...{ [FILTER_SELECT_LABEL_ATTRIBUTE]: "" }} className="invisible whitespace-nowrap pl-3 pr-8 text-body font-semibold">{selectedLabel}</span>
      <select
        aria-label={label}
        name={name}
        {...valueProps}
        className="absolute inset-0 h-11 w-full appearance-none rounded-full bg-transparent pl-3 pr-8 text-body font-semibold text-content-strong"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 size-4 text-content-muted" />
    </span>
  );
}

/** 폭을 잡는 보이지 않는 글자의 표시. 첫 그리기 전에 주소의 값을 넣는 inline script(place-region-select-fallback.tsx)가 이 글자도 바꾼다. */
export const FILTER_SELECT_LABEL_ATTRIBUTE = "data-filter-select-label";

/** 칩 줄 맨 앞의 고르기 칸과 칩 사이 세로 구분선. "어디서(지역) → 무엇을(분류)" 두 단계를 나눠 보이게 한다(2026-11-22). */
export const filterSelectDividerClassName = "h-6 w-px shrink-0 bg-line-strong";
