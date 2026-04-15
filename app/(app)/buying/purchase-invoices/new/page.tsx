import { AppShell } from "@/components/app-shell";
import { PurchaseInvoiceForm } from "@/modules/buying/components/PurchaseInvoiceForm";

export default async function NewPurchaseInvoicePage({
  searchParams
}: {
  searchParams: Promise<{ source_doctype?: string; source_name?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell section="Buying" title="Create Purchase Invoice" breadcrumb="Buying > Purchase Invoices > New" subtitle="Record invoice-level payable details for suppliers.">
      <PurchaseInvoiceForm sourceDoctype={params.source_doctype} sourceName={params.source_name} />
    </AppShell>
  );
}
