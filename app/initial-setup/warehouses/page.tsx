import { AppShell } from "@/components/app-shell";
import { WarehouseSetupPageContent } from "@/modules/initial-setup/components/WarehouseSetupPageContent";

export default function InitialSetupWarehousesPage() {
  return (
    <AppShell
      section="Administration"
      title="Warehouse Setup"
      breadcrumb="Administration > Initial Setup > Warehouses"
      subtitle="Create root and child warehouse structures for stock operations."
    >
      <WarehouseSetupPageContent />
    </AppShell>
  );
}