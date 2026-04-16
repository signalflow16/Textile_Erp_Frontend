"use client";

import { SellingDocumentList } from "@/modules/selling/components/SellingDocumentList";
import { useSellingMasters } from "@/modules/selling/hooks/useSellingMasters";
import { useListSalesOrders } from "@/modules/selling/hooks/useSalesOrders";

export function SalesOrderList() {
  const masters = useSellingMasters();

  return (
    <SellingDocumentList
      title="Sales Orders"
      subtitle="Confirmed customer orders ready for fulfillment planning."
      routeBase="/selling/sales-orders"
      companies={masters.data?.companies ?? []}
      customers={masters.data?.customers ?? []}
      useList={useListSalesOrders}
    />
  );
}
