import { combineDateAndOptionalTime } from "@/features/events/admin/datetime";
import { createEventSlug } from "@/features/events/admin/event-payload";
import { formString } from "@/lib/form-data";

function dateTimeValue(formData: FormData, key: string) {
  return combineDateAndOptionalTime(formString(formData, key), formString(formData, `${key}Time`));
}

/** 회차 입력은 시작일·시작시각·종료일·종료시각 네 칸이 같은 순서로 반복된다. 빈 줄은 버린다. */
function occurrenceValues(formData: FormData) {
  function strings(key: string) {
    return formData.getAll(key).map((item) => typeof item === "string" ? item : "");
  }
  const starts = strings("occurrenceStartsAt");
  const startTimes = strings("occurrenceStartsAtTime");
  const ends = strings("occurrenceEndsAt");
  const endTimes = strings("occurrenceEndsAtTime");

  return starts
    .map((startsAt, index) => ({
      startsAt: combineDateAndOptionalTime(startsAt, startTimes[index] ?? ""),
      endsAt: combineDateAndOptionalTime(ends[index] ?? "", endTimes[index] ?? ""),
    }))
    .filter((occurrence) => occurrence.startsAt.trim() || occurrence.endsAt.trim());
}

/** 줄바꿈이나 쉼표로 나눈 목록(출연자 등). */
function listValues(formData: FormData, key: string) {
  return formString(formData, key)
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** 행사 폼의 FormData를 eventFormSchema가 검증할 모양으로 바꾼다. 검증은 하지 않는다. */
export function readEventFormInput(formData: FormData) {
  const uploadedImageUrl = formString(formData, "uploadedImageUrl");
  return {
    uploadedImageUrl,
    values: {
      id: formString(formData, "id") || undefined,
      slug: formString(formData, "slug") || createEventSlug(),
      title: formString(formData, "title"),
      introduction: formString(formData, "introduction"),
      category: formString(formData, "category"),
      audiences: formData.getAll("audiences").filter((item): item is string => typeof item === "string"),
      eventStartAt: dateTimeValue(formData, "eventStartAt"),
      eventEndAt: dateTimeValue(formData, "eventEndAt"),
      operatingHours: formString(formData, "operatingHours"),
      // 비어 있으면 schema 기본값(continuous)을 쓴다. 기본값은 eventFormSchema 한 곳에 둔다.
      scheduleMode: formString(formData, "scheduleMode") || undefined,
      occurrences: occurrenceValues(formData),
      applicationStartAt: dateTimeValue(formData, "applicationStartAt"),
      applicationEndAt: dateTimeValue(formData, "applicationEndAt"),
      locationName: formString(formData, "locationName"),
      address: formString(formData, "address"),
      priceText: formString(formData, "priceText"),
      isFree: formString(formData, "isFree") || "unknown",
      performerPeople: listValues(formData, "performerPeople"),
      performerGroups: listValues(formData, "performerGroups"),
      organizer: formString(formData, "organizer"),
      organizerUrl: formString(formData, "organizerUrl"),
      contact: formString(formData, "contact"),
      applicationUrl: formString(formData, "applicationUrl"),
      imageUrl: uploadedImageUrl || formString(formData, "imageUrl"),
      sourceName: formString(formData, "sourceName"),
      sourceUrl: formString(formData, "sourceUrl"),
      isFeatured: formData.get("isFeatured") === "on",
    },
  };
}
