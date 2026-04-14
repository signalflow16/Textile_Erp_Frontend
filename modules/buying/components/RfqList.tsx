"use client";

import { BuyingDocumentList } from "@/modules/buying/components/BuyingDocumentList";
import { useBuyingMasters } from "@/modules/buying/hooks/useBuyingMasters";
import { useListRfqs } from "@/modules/buying/hooks/useRfqs";

export function RfqList() {
  const masters = useBuyingMasters();

  return (
    <BuyingDocumentList
      title="Request for Quotations"
      subtitle="RFQ is an optional quotation collection stage before final purchase commitment."
      routeBase="/buying/rfqs"
      includeSupplier={false}
      companies={masters.data?.companies ?? []}
      suppliers={masters.data?.suppliers ?? []}
      useList={useListRfqs}
    />
  );
}
