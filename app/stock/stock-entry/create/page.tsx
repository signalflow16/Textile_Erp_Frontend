import { AppShell } from "@/components/app-shell";
import { StockEntryForm } from "@/components/stock/stock-entry-form";

export default function StockEntryCreatePage() {
  return (
    <AppShell
      title="Create Stock Entry"
      breadcrumb="Stock > Stock Entry > Create"
      subtitle="Create stock movements with ERPNext-compatible posting data and item rows."
    >
      <StockEntryForm />
    </AppShell>
  );
}
