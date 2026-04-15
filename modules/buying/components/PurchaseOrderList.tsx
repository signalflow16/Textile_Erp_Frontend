"use client";

import { BuyingDocumentList } from "@/modules/buying/components/BuyingDocumentList";
import { useBuyingMasters } from "@/modules/buying/hooks/useBuyingMasters";
import { useListPurchaseOrders } from "@/modules/buying/hooks/usePurchaseOrders";

export function PurchaseOrderList() {
  const masters = useBuyingMasters();

  return (
    <BuyingDocumentList
      title="Purchase Orders"
      subtitle="Purchase Order confirms procurement and supplier commitment."
      routeBase="/buying/purchase-orders"
      includeSupplier
      companies={masters.data?.companies ?? []}
      suppliers={masters.data?.suppliers ?? []}
      useList={useListPurchaseOrders}
    />
  );
}
