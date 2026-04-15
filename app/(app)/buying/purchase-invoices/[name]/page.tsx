import { AppShell } from "@/components/app-shell";
import { PurchaseInvoiceDetail } from "@/modules/buying/components/PurchaseInvoiceDetail";
import { PurchaseInvoiceForm } from "@/modules/buying/components/PurchaseInvoiceForm";

export default async function PurchaseInvoiceDetailPage({
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
      title={editMode ? `Edit Purchase Invoice ${decoded}` : `Purchase Invoice ${decoded}`}
      breadcrumb={`Buying > Purchase Invoices > ${decoded}`}
      subtitle="Purchase Invoice affects supplier liability and finance books."
    >
      {editMode ? <PurchaseInvoiceForm name={decoded} /> : <PurchaseInvoiceDetail name={decoded} />}
    </AppShell>
  );
}
