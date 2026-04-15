import { AppShell } from "@/components/app-shell";
import { PurchaseInvoiceList } from "@/modules/buying/components/PurchaseInvoiceList";

export default function PurchaseInvoicesPage() {
  return (
    <AppShell section="Buying" title="Purchase Invoices" breadcrumb="Buying > Purchase Invoices" subtitle="Track supplier bills and payable liabilities.">
      <PurchaseInvoiceList />
    </AppShell>
  );
}
