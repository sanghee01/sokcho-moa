"use client";

import { useState } from "react";
import { getButtonClassName } from "@/components/ui/button-styles";
import {
  DateTimeField,
  FieldHelp,
  inputClassName,
  labelClassName,
} from "@/features/events/admin/components/event-form-fields";
import type { EventRow } from "@/features/events/admin/components/event-form-row";
import { text } from "@/features/events/admin/components/event-form-row";
import { isoToSeoulDatetimeLocal } from "@/features/events/admin/datetime";
import { eventScheduleModes, isEventScheduleMode, type EventScheduleMode } from "@/features/events/model/event";

interface OccurrenceDraft { key: string; startsAt: string; endsAt: string }

const scheduleModeLabels: Record<EventScheduleMode, string> = {
  continuous: "행사기간 동안 계속 운영",
  occurrences: "지정한 운영 회차에만 운영",
};

function initialOccurrences(row: EventRow): OccurrenceDraft[] {
  return (row?.event_occurrences ?? [])
    .map((occurrence) => ({
      key: occurrence.id,
      startsAt: isoToSeoulDatetimeLocal(occurrence.starts_at),
      endsAt: occurrence.ends_at ? isoToSeoulDatetimeLocal(occurrence.ends_at) : "",
    }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * 운영 방식 선택과 회차 편집. "기간 내내 운영"이면 행사 기간만 쓰고,
 * "지정 회차"면 입력한 회차만 운영일로 저장한다(저장은 행사와 같은 RPC에서 한 번에).
 */
export function ScheduleModeField({ row }: { row: EventRow }) {
  const savedScheduleMode = text(row, "schedule_mode");
  const [scheduleMode, setScheduleMode] = useState<EventScheduleMode>(
    isEventScheduleMode(savedScheduleMode) ? savedScheduleMode : "continuous",
  );
  const [occurrences, setOccurrences] = useState<OccurrenceDraft[]>(() => initialOccurrences(row));

  function selectScheduleMode(value: EventScheduleMode) {
    setScheduleMode(value);
    if (value === "occurrences" && occurrences.length === 0) {
      setOccurrences([{ key: "new-0", startsAt: "", endsAt: "" }]);
    }
  }
  function addOccurrence() {
    setOccurrences((current) => [
      ...current,
      { key: `new-${Date.now()}`, startsAt: "", endsAt: "" },
    ]);
  }
  function removeOccurrence(key: string) {
    setOccurrences((current) => current.filter((item) => item.key !== key));
  }

  return (
    <>
      <label className={`${labelClassName} sm:col-span-2`}>
        운영 방식
        <select
          name="scheduleMode"
          value={scheduleMode}
          onChange={(event) => {
            if (isEventScheduleMode(event.target.value)) selectScheduleMode(event.target.value);
          }}
          className={inputClassName}
        >
          {eventScheduleModes.map((mode) => <option key={mode} value={mode}>{scheduleModeLabels[mode]}</option>)}
        </select>
        <FieldHelp>매일 이어지는 행사는 행사기간을, 특정 날짜·요일에만 열리면 실제 운영 회차를 선택하세요.</FieldHelp>
      </label>
      {scheduleMode === "occurrences" && (
        <fieldset className="space-y-3 rounded-card border border-primary bg-primary-subtle p-4 sm:col-span-2">
          <legend className="sr-only">실제 운영 회차</legend>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={labelClassName}>실제 운영 회차</p>
              <p className="mt-1 text-caption font-normal leading-5 text-content-muted">공개 화면에는 아래 날짜만 운영일로 표시됩니다. 같은 날 여러 회차도 각각 입력할 수 있어요.</p>
            </div>
            <button type="button" onClick={addOccurrence} className={getButtonClassName({ variant: "tonal" })}>회차 추가</button>
          </div>
          {occurrences.length === 0 ? (
            <p className="rounded-control bg-surface px-4 py-3 text-label text-content-muted">회차 추가를 눌러 실제 운영 날짜를 입력해 주세요.</p>
          ) : (
            <div className="space-y-3">
              {occurrences.map((occurrence, index) => (
                <div key={occurrence.key} className="grid gap-3 rounded-control bg-surface p-3 ring-1 ring-line sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <DateTimeField labelText={`회차 ${index + 1} 시작`} name="occurrenceStartsAt" defaultValue={occurrence.startsAt} requiredDate />
                  <DateTimeField labelText={`회차 ${index + 1} 종료`} name="occurrenceEndsAt" defaultValue={occurrence.endsAt} />
                  <button type="button" onClick={() => removeOccurrence(occurrence.key)} aria-label={`회차 ${index + 1} 삭제`} className={getButtonClassName({ variant: "neutral" })}>삭제</button>
                </div>
              ))}
            </div>
          )}
        </fieldset>
      )}
    </>
  );
}
