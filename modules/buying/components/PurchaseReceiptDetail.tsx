"use client";

import { BuyingDocumentDetail } from "@/modules/buying/components/BuyingDocumentDetail";
import { useGetPurchaseReceipt, useSubmitPurchaseReceipt } from "@/modules/buying/hooks/usePurchaseReceipts";
import { buildSourceCreateHref } from "@/modules/buying/utils/sourceRouteHelpers";

export function PurchaseReceiptDetail({ name }: { name: string }) {
  const query = useGetPurchaseReceipt(name);
  const submit = useSubmitPurchaseReceipt();

  return (
    <BuyingDocumentDetail
      title="Purchase Receipt"
      routeBase="/buying/purchase-receipts"
      document={(query.data ?? null) as unknown as Record<string, unknown> | null}
      loading={query.isFetching}
      error={query.error}
      onSubmitDraft={submit.submit}
      submitLoading={submit.isLoading}
      nextActions={[
        { label: "Create Purchase Invoice", href: buildSourceCreateHref("/buying/purchase-invoices/new", { doctype: "Purchase Receipt", name }) }
      ]}
      stockImpactNote="Stock impact: Purchase Receipt updates stock levels."
    />
  );
}
