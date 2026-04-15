import { AppShell } from "@/components/app-shell";
import { StockDashboardPage } from "@/modules/stock/components/stock-dashboard-page";

export default function StockPage() {
  return (
    <AppShell
      title="Stock Dashboard"
      breadcrumb="Stock"
      subtitle="Live inventory visibility, warehouse value trends, and stock movement monitoring."
    >
      <StockDashboardPage />
    </AppShell>
  );
}
