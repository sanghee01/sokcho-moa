import { HeaderNavigation } from "@/components/header-navigation";

export default function HeaderNavigationE2EPage() {
  return (
    <main data-testid="header-navigation-harness" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <HeaderNavigation />
    </main>
  );
}
