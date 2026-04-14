import { AppShell } from "@/components/app-shell";
import { PurchaseReceiptForm } from "@/modules/buying/components/PurchaseReceiptForm";

export default async function NewPurchaseReceiptPage({
  searchParams
}: {
  searchParams: Promise<{ source_doctype?: string; source_name?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell section="Buying" title="Create Purchase Receipt" breadcrumb="Buying > Purchase Receipts > New" subtitle="Capture received quantities and warehouse stock-in.">
      <PurchaseReceiptForm sourceDoctype={params.source_doctype} sourceName={params.source_name} />
    </AppShell>
  );
}
