import { AppShell } from "@/components/app-shell";
import { PurchaseOrderList } from "@/modules/buying/components/PurchaseOrderList";

export default function PurchaseOrdersPage() {
  return (
    <AppShell section="Buying" title="Purchase Orders" breadcrumb="Buying > Purchase Orders" subtitle="Confirm supplier procurement and schedule delivery.">
      <PurchaseOrderList />
    </AppShell>
  );
}
