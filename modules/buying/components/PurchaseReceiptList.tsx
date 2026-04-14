"use client";

import { BuyingDocumentList } from "@/modules/buying/components/BuyingDocumentList";
import { useBuyingMasters } from "@/modules/buying/hooks/useBuyingMasters";
import { useListPurchaseReceipts } from "@/modules/buying/hooks/usePurchaseReceipts";

export function PurchaseReceiptList() {
  const masters = useBuyingMasters();

  return (
    <BuyingDocumentList
      title="Purchase Receipts"
      subtitle="Purchase Receipt records received quantity and updates stock."
      routeBase="/buying/purchase-receipts"
      includeSupplier
      companies={masters.data?.companies ?? []}
      suppliers={masters.data?.suppliers ?? []}
      useList={useListPurchaseReceipts}
    />
  );
}
