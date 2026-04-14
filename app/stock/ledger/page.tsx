import { AppShell } from "@/components/app-shell";
import { StockLedgerPage } from "@/components/stock/reports/stock-ledger-page";

export default function StockLedgerRoute() {
  return (
    <AppShell
      title="Stock Ledger"
      breadcrumb="Stock > Reports > Stock Ledger"
      subtitle="Chronological stock movement report using Frappe stock ledger entries."
    >
      <StockLedgerPage />
    </AppShell>
  );
}
