import { AppShell } from "@/components/app-shell";
import { SupplierQuotationForm } from "@/modules/buying/components/SupplierQuotationForm";

export default async function NewSupplierQuotationPage({
  searchParams
}: {
  searchParams: Promise<{ source_doctype?: string; source_name?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell section="Buying" title="Create Supplier Quotation" breadcrumb="Buying > Supplier Quotations > New" subtitle="Record supplier quotation details for decision making.">
      <SupplierQuotationForm sourceDoctype={params.source_doctype} sourceName={params.source_name} />
    </AppShell>
  );
}
