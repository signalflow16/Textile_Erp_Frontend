import { AppShell } from "@/components/app-shell";
import { UnderDevelopmentPage } from "@/components/under-development-page";

export default function SettingsPage() {
  return (
    <AppShell title="ERPNext Settings" breadcrumb="ERPNext Settings">
      <UnderDevelopmentPage />
    </AppShell>
  );
}
