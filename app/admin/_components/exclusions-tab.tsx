import { EventCollectionExclusionList } from "@/features/events/admin/components/exclusion-list";
import { getAdminEventCollectionExclusions } from "@/features/events/admin/queries";

/** 관리자 대시보드의 "재수집 제외" 탭 */
export async function AdminExclusionsTab() {
  const exclusions = await getAdminEventCollectionExclusions();
  return <EventCollectionExclusionList exclusions={exclusions} />;
}
