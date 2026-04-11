import { AppShell } from "@/components/app-shell";
import { CustomerSetupPageContent } from "@/modules/initial-setup/components/CustomerSetupPageContent";

export default function InitialSetupCustomersPage() {
  return (
    <AppShell
      section="Administration"
      title="Customer Setup"
      breadcrumb="Administration > Initial Setup > Customers"
      subtitle="Create customer master data in batch for sales workflows."
    >
      <CustomerSetupPageContent />
    </AppShell>
  );
}