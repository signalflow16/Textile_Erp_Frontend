"use client";

import { BuyingDocumentDetail } from "@/modules/buying/components/BuyingDocumentDetail";
import { useGetPurchaseInvoice, useSubmitPurchaseInvoice } from "@/modules/buying/hooks/usePurchaseInvoices";

export function PurchaseInvoiceDetail({ name }: { name: string }) {
  const query = useGetPurchaseInvoice(name);
  const submit = useSubmitPurchaseInvoice();

  return (
    <BuyingDocumentDetail
      title="Purchase Invoice"
      routeBase="/buying/purchase-invoices"
      document={(query.data ?? null) as unknown as Record<string, unknown> | null}
      loading={query.isFetching}
      error={query.error}
      onSubmitDraft={submit.submit}
      submitLoading={submit.isLoading}
      nextActions={[
        { label: "Go to Buying Dashboard", href: "/buying" }
      ]}
      financeImpactNote="Finance impact: Purchase Invoice updates supplier payable liability."
    />
  );
}
