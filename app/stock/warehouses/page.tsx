import { AppShell } from "@/components/app-shell";
import { WarehouseWorkspace } from "@/modules/stock/components/warehouses/workspace";

export default async function StockWarehousesRoute({
  searchParams
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell
      title="Warehouses"
      breadcrumb="Stock > Warehouses"
      subtitle="Tree-based warehouse management with page-based edit and root-only child creation."
    >
      <WarehouseWorkspace selectedWarehouse={params.selected ? decodeURIComponent(params.selected) : undefined} />
    </AppShell>
  );
}
