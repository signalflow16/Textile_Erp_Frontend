import { AppShell } from "@/components/app-shell";
import { ItemPricePanel } from "@/components/stock/item-price-panel";

export default async function ItemPricesPage({
  params
}: {
  params: Promise<{ itemCode: string }>;
}) {
  const { itemCode } = await params;
  const decodedItemCode = decodeURIComponent(itemCode);

  return (
    <AppShell
      title={`Prices for ${decodedItemCode}`}
      breadcrumb={`Stock > Item > ${decodedItemCode} > Prices`}
      subtitle="Retail and wholesale price visibility from textile_erp item pricing endpoints."
    >
      <ItemPricePanel itemCode={decodedItemCode} />
    </AppShell>
  );
}
