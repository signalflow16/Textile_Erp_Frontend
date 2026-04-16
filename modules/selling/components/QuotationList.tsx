"use client";

import { SellingDocumentList } from "@/modules/selling/components/SellingDocumentList";
import { useSellingMasters } from "@/modules/selling/hooks/useSellingMasters";
import { useListQuotations } from "@/modules/selling/hooks/useQuotations";

export function QuotationList() {
  const masters = useSellingMasters();

  return (
    <SellingDocumentList
      title="Quotations"
      subtitle="Customer proposals with pricing, validity, and item-level scope."
      routeBase="/selling/quotations"
      companies={masters.data?.companies ?? []}
      customers={masters.data?.customers ?? []}
      useList={useListQuotations}
    />
  );
}
