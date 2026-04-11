import { AppShell } from "@/components/app-shell";
import { SupplierSetupPageContent } from "@/modules/initial-setup/components/SupplierSetupPageContent";

export default function InitialSetupSuppliersPage() {
  return (
    <AppShell
      section="Administration"
      title="Supplier Setup"
      breadcrumb="Administration > Initial Setup > Suppliers"
      subtitle="Create supplier master data in batch for procurement workflows."
    >
      <SupplierSetupPageContent />
    </AppShell>
  );
}