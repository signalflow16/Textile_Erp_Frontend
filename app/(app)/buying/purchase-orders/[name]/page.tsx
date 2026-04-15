import { AppShell } from "@/components/app-shell";
import { PurchaseOrderDetail } from "@/modules/buying/components/PurchaseOrderDetail";
import { PurchaseOrderForm } from "@/modules/buying/components/PurchaseOrderForm";

export default async function PurchaseOrderDetailPage({
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
      title={editMode ? `Edit Purchase Order ${decoded}` : `Purchase Order ${decoded}`}
      breadcrumb={`Buying > Purchase Orders > ${decoded}`}
      subtitle="Purchase Order confirms buying commitment."
    >
      {editMode ? <PurchaseOrderForm name={decoded} /> : <PurchaseOrderDetail name={decoded} />}
    </AppShell>
  );
}
