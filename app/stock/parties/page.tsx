import { AppShell } from "@/components/app-shell";
import { StockPartiesPage } from "@/components/stock/stock-parties-page";

export default function StockPartiesRoute() {
  return (
    <AppShell
      title="Parties"
      breadcrumb="Stock > Parties"
    >
      <StockPartiesPage />
    </AppShell>
  );
}
