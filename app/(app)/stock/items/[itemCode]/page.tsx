"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { StoreHydratedItemPage } from "@/modules/stock/components/store-hydrated-item-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function EditItemPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ itemCode: string }>();
  const itemCode = decodeURIComponent(params.itemCode);

  useEffect(() => {
    setConfig({
      title: `Edit Item ${itemCode}`,
      subtitle: "Update item master values, textile attributes, and barcode records."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [itemCode, setConfig]);

  return <StoreHydratedItemPage itemCode={itemCode} />;
}
