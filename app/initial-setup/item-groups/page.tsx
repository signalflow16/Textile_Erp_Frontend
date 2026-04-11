import { AppShell } from "@/components/app-shell";
import { ItemGroupSetupPageContent } from "@/modules/initial-setup/components/ItemGroupSetupPageContent";

export default function InitialSetupItemGroupsPage() {
  return (
    <AppShell
      section="Administration"
      title="Item Group Setup"
      breadcrumb="Administration > Initial Setup > Item Groups"
      subtitle="Create item group hierarchy for textile catalogue organization."
    >
      <ItemGroupSetupPageContent />
    </AppShell>
  );
}