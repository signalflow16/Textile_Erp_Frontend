import { AppShell } from "@/components/app-shell";
import { StockEntryListPage } from "@/components/stock/stock-entry-list-page";

export default function StockEntryListRoute() {
  return (
    <AppShell
      title="Stock Entry List"
      breadcrumb="Stock > Stock Entry > List"
      subtitle="Review stock movements, filter by posting date, and inspect entry details."
    >
      <StockEntryListPage />
    </AppShell>
  );
}
