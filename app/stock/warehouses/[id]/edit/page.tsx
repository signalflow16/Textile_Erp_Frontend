import { AppShell } from "@/components/app-shell";
import { WarehouseEditor } from "@/components/stock/warehouses/editor";

export default async function EditWarehousePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  const warehouseName = decodeURIComponent(routeParams.id);

  return (
    <AppShell
      title={warehouseName}
      breadcrumb={`Stock > Warehouses > ${warehouseName}`}
      subtitle="Review warehouse information and update it from the document page."
    >
      <WarehouseEditor mode="edit" warehouseName={warehouseName} />
    </AppShell>
  );
}
