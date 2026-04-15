import { AppShell } from "@/components/app-shell";
import { PurchaseOrderForm } from "@/modules/buying/components/PurchaseOrderForm";

export default async function NewPurchaseOrderPage({
  searchParams
}: {
  searchParams: Promise<{ source_doctype?: string; source_name?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell section="Buying" title="Create Purchase Order" breadcrumb="Buying > Purchase Orders > New" subtitle="Create and save draft procurement orders.">
      <PurchaseOrderForm sourceDoctype={params.source_doctype} sourceName={params.source_name} />
    </AppShell>
  );
}
