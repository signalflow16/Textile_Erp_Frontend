import { AppShell } from "@/components/app-shell";
import { UomSetupPageContent } from "@/modules/initial-setup/components/UomSetupPageContent";

export default function InitialSetupUomsPage() {
  return (
    <AppShell
      section="Administration"
      title="UOM Setup"
      breadcrumb="Administration > Initial Setup > UOMs"
      subtitle="Maintain measurement units for item master and transactions."
    >
      <UomSetupPageContent />
    </AppShell>
  );
}