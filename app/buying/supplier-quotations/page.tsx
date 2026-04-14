import { AppShell } from "@/components/app-shell";
import { SupplierQuotationList } from "@/modules/buying/components/SupplierQuotationList";

export default function SupplierQuotationsPage() {
  return (
    <AppShell section="Buying" title="Supplier Quotations" breadcrumb="Buying > Supplier Quotations" subtitle="Capture vendor rates and terms.">
      <SupplierQuotationList />
    </AppShell>
  );
}
