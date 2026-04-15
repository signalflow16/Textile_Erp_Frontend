"use client";

import { BuyingDocumentDetail } from "@/modules/buying/components/BuyingDocumentDetail";
import { useGetSupplierQuotation, useSubmitSupplierQuotation } from "@/modules/buying/hooks/useSupplierQuotations";
import { buildSourceCreateHref } from "@/modules/buying/utils/sourceRouteHelpers";

export function SupplierQuotationDetail({ name }: { name: string }) {
  const query = useGetSupplierQuotation(name);
  const submit = useSubmitSupplierQuotation();

  return (
    <BuyingDocumentDetail
      title="Supplier Quotation"
      routeBase="/buying/supplier-quotations"
      document={(query.data ?? null) as unknown as Record<string, unknown> | null}
      loading={query.isFetching}
      error={query.error}
      onSubmitDraft={submit.submit}
      submitLoading={submit.isLoading}
      nextActions={[
        { label: "Create Purchase Order", href: buildSourceCreateHref("/buying/purchase-orders/new", { doctype: "Supplier Quotation", name }) }
      ]}
      stockImpactNote="Quotation document: Supplier Quotation does not change stock."
    />
  );
}
