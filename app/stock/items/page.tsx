import { AppShell } from "@/components/app-shell";
import { StockItemsPage } from "@/modules/stock/components/stock-items-page";

export default function ItemsPage() {
  return (
    <AppShell
      title="Items"
      breadcrumb="Stock > Items"
      subtitle="Search, filter, and create stock items through the master-data workspace."
    >
      <StockItemsPage />
    </AppShell>
  );
}
