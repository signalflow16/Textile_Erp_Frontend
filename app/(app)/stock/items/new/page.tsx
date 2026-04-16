"use client";

import { useEffect } from "react";
import { ItemForm } from "@/modules/stock/components/item-form";
import { useAppShell } from "@/core/context/app-shell-context";

export default function NewItemPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Create Item",
      subtitle: "Create a stock item master with textile attributes, pricing, and barcode definitions."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return (
    <div className="page-stack">
      <ItemForm mode="create" />
    </div>
  );
}
