import { AppShell } from "@/components/app-shell";
import { InitialSetupPage } from "@/modules/initial-setup/components/InitialSetupPage";

export default function InitialSetupRoutePage() {
  return (
    <AppShell
      section="Administration"
      title="Initial Setup"
      breadcrumb="Administration > Initial Setup"
      subtitle="Configure company, warehouses, UOMs, item groups, suppliers, and customers before item creation."
    >
      <InitialSetupPage />
    </AppShell>
  );
}