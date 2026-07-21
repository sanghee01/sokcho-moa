import { notFound } from "next/navigation";
import { HeaderNavigationLinks } from "@/components/header-navigation";

export default async function HeaderNavigationE2EPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { admin } = await searchParams;

  return (
    <main data-testid="header-navigation-harness" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <HeaderNavigationLinks isAdmin={admin === "1"} />
    </main>
  );
}
