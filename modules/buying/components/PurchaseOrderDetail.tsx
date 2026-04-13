"use client";

import { BuyingDocumentDetail } from "@/modules/buying/components/BuyingDocumentDetail";
import { useGetPurchaseOrder, useSubmitPurchaseOrder } from "@/modules/buying/hooks/usePurchaseOrders";
import { buildSourceCreateHref } from "@/modules/buying/utils/sourceRouteHelpers";

export function PurchaseOrderDetail({ name }: { name: string }) {
  const query = useGetPurchaseOrder(name);
  const submit = useSubmitPurchaseOrder();

  return (
    <BuyingDocumentDetail
      title="Purchase Order"
      routeBase="/buying/purchase-orders"
      document={(query.data ?? null) as unknown as Record<string, unknown> | null}
      loading={query.isFetching}
      error={query.error}
      onSubmitDraft={submit.submit}
      submitLoading={submit.isLoading}
      nextActions={[
        { label: "Create Purchase Receipt", href: buildSourceCreateHref("/buying/purchase-receipts/new", { doctype: "Purchase Order", name }) },
        { label: "Create Purchase Invoice", href: buildSourceCreateHref("/buying/purchase-invoices/new", { doctype: "Purchase Order", name }) }
      ]}
      stockImpactNote="Commitment document: Purchase Order does not directly change stock."
    />
  );
}
