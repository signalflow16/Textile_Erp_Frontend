"use client";

import { BuyingDocumentList } from "@/modules/buying/components/BuyingDocumentList";
import { useBuyingMasters } from "@/modules/buying/hooks/useBuyingMasters";
import { useListSupplierQuotations } from "@/modules/buying/hooks/useSupplierQuotations";

export function SupplierQuotationList() {
  const masters = useBuyingMasters();

  return (
    <BuyingDocumentList
      title="Supplier Quotations"
      subtitle="Capture supplier rates and terms for comparison before creating Purchase Order."
      routeBase="/buying/supplier-quotations"
      includeSupplier
      companies={masters.data?.companies ?? []}
      suppliers={masters.data?.suppliers ?? []}
      useList={useListSupplierQuotations}
    />
  );
}
