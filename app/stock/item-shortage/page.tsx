import { AppShell } from "@/components/app-shell";
import { ItemShortagePage } from "@/components/stock/reports/item-shortage-page";

export default function ItemShortageRoute() {
  return (
    <AppShell
      title="Item Shortage"
      breadcrumb="Stock > Reports > Item Shortage"
      subtitle="Low stock exceptions with manual threshold fallback for current inventory."
    >
      <ItemShortagePage />
    </AppShell>
  );
}
