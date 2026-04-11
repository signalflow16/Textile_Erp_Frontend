import { AppShell } from "@/components/app-shell";
import { UnderDevelopmentPage } from "@/components/under-development-page";

export default function QualityPage() {
  return (
    <AppShell title="Quality" breadcrumb="Quality">
      <UnderDevelopmentPage />
    </AppShell>
  );
}
