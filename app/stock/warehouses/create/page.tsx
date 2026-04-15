import { AppShell } from "@/components/app-shell";
import { WarehouseEditor } from "@/modules/stock/components/warehouses/editor";

export default async function CreateWarehousePage({
  searchParams
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell
      title="Create Warehouse"
      breadcrumb="Stock > Warehouses > Create"
      subtitle="Create a new warehouse from a document-style page."
    >
      <WarehouseEditor mode="create" parentWarehouse={params.parent ? decodeURIComponent(params.parent) : undefined} />
    </AppShell>
  );
}
