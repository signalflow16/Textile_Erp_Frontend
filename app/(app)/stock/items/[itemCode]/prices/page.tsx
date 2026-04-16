"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ItemPricePanel } from "@/modules/stock/components/item-price-panel";
import { useAppShell } from "@/core/context/app-shell-context";

export default function ItemPricesPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ itemCode: string }>();
  const decodedItemCode = decodeURIComponent(params.itemCode);

  useEffect(() => {
    setConfig({
      title: `Prices for ${decodedItemCode}`,
      subtitle: "Retail and wholesale price visibility from textile_erp item pricing endpoints."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [decodedItemCode, setConfig]);

  return <ItemPricePanel itemCode={decodedItemCode} />;
}
