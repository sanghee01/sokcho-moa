import { notFound } from "next/navigation";
import { StatusControlsE2EHarness } from "@/components/admin/status-controls-e2e-harness";

export default function AdminStatusE2EPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StatusControlsE2EHarness />;
}
