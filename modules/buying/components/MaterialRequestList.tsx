"use client";

import { BuyingDocumentList } from "@/modules/buying/components/BuyingDocumentList";
import { useBuyingMasters } from "@/modules/buying/hooks/useBuyingMasters";
import { useListMaterialRequests } from "@/modules/buying/hooks/useMaterialRequests";

export function MaterialRequestList() {
  const masters = useBuyingMasters();

  return (
    <BuyingDocumentList
      title="Material Requests"
      subtitle="Material Request is for purchase demand planning. It does not impact stock."
      routeBase="/buying/material-requests"
      includeSupplier={false}
      companies={masters.data?.companies ?? []}
      suppliers={masters.data?.suppliers ?? []}
      useList={useListMaterialRequests}
    />
  );
}
