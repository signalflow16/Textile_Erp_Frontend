import { AppShell } from "@/components/app-shell";
import { UnderDevelopmentPage } from "@/components/under-development-page";

export default function SupportPage() {
  return (
    <AppShell title="Support" breadcrumb="Support">
      <UnderDevelopmentPage />
    </AppShell>
  );
}
