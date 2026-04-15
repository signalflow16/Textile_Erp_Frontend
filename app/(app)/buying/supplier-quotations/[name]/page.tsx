import { AppShell } from "@/components/app-shell";
import { SupplierQuotationDetail } from "@/modules/buying/components/SupplierQuotationDetail";
import { SupplierQuotationForm } from "@/modules/buying/components/SupplierQuotationForm";

export default async function SupplierQuotationDetailPage({
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
      title={editMode ? `Edit Supplier Quotation ${decoded}` : `Supplier Quotation ${decoded}`}
      breadcrumb={`Buying > Supplier Quotations > ${decoded}`}
      subtitle="Supplier quotation captures vendor-specific offers."
    >
      {editMode ? <SupplierQuotationForm name={decoded} /> : <SupplierQuotationDetail name={decoded} />}
    </AppShell>
  );
}
