"use client";

import { SellingDocumentDetail } from "@/modules/selling/components/SellingDocumentDetail";
import { useCancelSalesOrder, useGetSalesOrder, useSubmitSalesOrder } from "@/modules/selling/hooks/useSalesOrders";
import { buildSourceCreateHref } from "@/modules/selling/utils/sourceRouteHelpers";

export function SalesOrderDetail({ name }: { name: string }) {
  const query = useGetSalesOrder(name);
  const submit = useSubmitSalesOrder();
  const cancel = useCancelSalesOrder();

  return (
    <SellingDocumentDetail
      title="Sales Order"
      routeBase="/selling/sales-orders"
      document={(query.data ?? null) as unknown as Record<string, unknown> | null}
      loading={query.isFetching}
      error={query.error}
      onSubmitDraft={submit.submit}
      onCancelSubmitted={cancel.submit}
      submitLoading={submit.isLoading}
      cancelLoading={cancel.isLoading}
      nextActions={[
        { label: "Create Delivery Note", href: buildSourceCreateHref("/selling/delivery-notes/new", { doctype: "Sales Order", name }) }
      ]}
      stockImpactNote="Sales Order confirms demand and drives downstream delivery creation."
    />
  );
}
