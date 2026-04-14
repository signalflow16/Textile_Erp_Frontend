import { AppShell } from "@/components/app-shell";
import { StockBalancePage } from "@/components/stock/reports/stock-balance-page";

export default function StockBalanceRoute() {
  return (
    <AppShell
      title="Stock Balance"
      breadcrumb="Stock > Reports > Stock Balance"
      subtitle="Live quantity and stock value visibility by item and warehouse."
    >
      <StockBalancePage />
    </AppShell>
  );
}
