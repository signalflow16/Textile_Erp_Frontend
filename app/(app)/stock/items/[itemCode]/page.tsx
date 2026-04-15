import { AppShell } from "@/components/app-shell";
import { StoreHydratedItemPage } from "@/modules/stock/components/store-hydrated-item-page";

export default async function EditItemPage({
  params
}: {
  params: Promise<{ itemCode: string }>;
}) {
  const { itemCode } = await params;

  return (
    <AppShell
      title={`Edit Item ${decodeURIComponent(itemCode)}`}
      breadcrumb={`Stock > Item > ${decodeURIComponent(itemCode)}`}
      subtitle="Update item master values, textile attributes, and barcode records."
    >
      <StoreHydratedItemPage itemCode={decodeURIComponent(itemCode)} />
    </AppShell>
  );
}
