"use client";

import { BuyingDocumentList } from "@/modules/buying/components/BuyingDocumentList";
import { useBuyingMasters } from "@/modules/buying/hooks/useBuyingMasters";
import { useListPurchaseInvoices } from "@/modules/buying/hooks/usePurchaseInvoices";

export function PurchaseInvoiceList() {
  const masters = useBuyingMasters();

  return (
    <BuyingDocumentList
      title="Purchase Invoices"
      subtitle="Purchase Invoice records supplier liability and payable amount."
      routeBase="/buying/purchase-invoices"
      includeSupplier
      companies={masters.data?.companies ?? []}
      suppliers={masters.data?.suppliers ?? []}
      useList={useListPurchaseInvoices}
    />
  );
}
