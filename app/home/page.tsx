import { AppShell } from "@/components/app-shell";
import { UnderDevelopmentPage } from "@/components/under-development-page";

export default function HomePage() {
  return (
    <AppShell title="Home" breadcrumb="Home">
      <UnderDevelopmentPage />
    </AppShell>
  );
}
