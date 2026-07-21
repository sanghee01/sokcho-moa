import { notFound } from "next/navigation";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { EventForm } from "@/components/admin/event-form";
import { getAdminDashboardFeedback } from "@/lib/admin/dashboard-feedback";

const editRow = {
  id: "10000000-0000-4000-8000-000000000094",
  slug: "existing-event-slug",
  title: "기존 행사 수정 테스트",
  summary: "운영자가 공개 결과를 이해하는지 확인하는 행사입니다.",
  description: "기술 메타데이터는 화면에 보이지 않아야 합니다.",
  category: "festival",
  audiences: ["family", "adult"],
  event_start_at: "2026-08-01T01:00:00.000Z",
  event_end_at: "2026-08-03T12:00:00.000Z",
  operating_hours: "8월 1일 10:00~18:00\n8월 2일 11:00~17:00",
  schedule_mode: "continuous",
  application_start_at: null,
  application_end_at: null,
  location_name: "속초문화예술회관",
  address: "강원특별자치도 속초시 번영로 155",
  latitude: 38.2051,
  longitude: 128.5778,
  location_source_url: "https://example.com/locations/sokcho-arts-center",
  location_verified_at: "2026-07-19T05:30:00.000Z",
  price_text: "무료",
  is_free: true,
  organizer: "속초시",
  contact: "033-000-0000",
  official_url: "https://example.com/legacy-official-guide",
  application_url: "https://example.com/apply/event",
  image_url: "https://example.com/event-poster.jpg",
  source_name: "속초시",
  source_url: "https://example.com/events/existing-event",
  is_featured: true,
  last_verified_at: "2026-07-20T05:30:00.000Z",
  event_occurrences: [],
};

export default async function EventFormE2EPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; saved?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const edit = params.mode === "edit";
  const feedbackMessage = getAdminDashboardFeedback({ saved: params.saved });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-bold text-teal-700">속초모아 운영자</p>
      <h1 className="mb-5 mt-1 text-2xl font-black">{edit ? "행사 수정" : "새 행사 등록"}</h1>
      <ActionFeedback message={feedbackMessage} />
      <EventForm row={edit ? editRow : null} />
    </main>
  );
}
