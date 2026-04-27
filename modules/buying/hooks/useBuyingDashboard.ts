import {
  useGetBuyingDashboardQuery,
  useListPurchaseInvoicesQuery,
  useListPurchaseOrdersQuery,
  useListPurchaseReceiptsQuery
} from "@/modules/buying/api/buyingApi";

export const useBuyingDashboard = () => useGetBuyingDashboardQuery();
export { useListPurchaseOrdersQuery, useListPurchaseInvoicesQuery, useListPurchaseReceiptsQuery };
