import { AppShell } from "@/components/app-shell";
import { WarehouseStockPage } from "@/modules/stock/components/reports/warehouse-stock-page";

export default function WarehouseStockRoute() {
  return (
    <AppShell
      title="Warehouse Stock"
      breadcrumb="Stock > Reports > Warehouse Stock"
      subtitle="Warehouse totals aggregated from the live Bin snapshot."
    >
      <WarehouseStockPage />
    </AppShell>
  );
}
