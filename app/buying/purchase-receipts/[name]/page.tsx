import { AppShell } from "@/components/app-shell";
import { PurchaseReceiptDetail } from "@/modules/buying/components/PurchaseReceiptDetail";
import { PurchaseReceiptForm } from "@/modules/buying/components/PurchaseReceiptForm";

export default async function PurchaseReceiptDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { name } = await params;
  const query = await searchParams;
  const decoded = decodeURIComponent(name);
  const editMode = query.edit === "1";

  return (
    <AppShell
      section="Buying"
      title={editMode ? `Edit Purchase Receipt ${decoded}` : `Purchase Receipt ${decoded}`}
      breadcrumb={`Buying > Purchase Receipts > ${decoded}`}
      subtitle="Purchase Receipt updates stock positions."
    >
      {editMode ? <PurchaseReceiptForm name={decoded} /> : <PurchaseReceiptDetail name={decoded} />}
    </AppShell>
  );
}
