"use client";

import { useEffect } from "react";
import { StockItemsPage } from "@/modules/stock/components/stock-items-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function ItemsPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Items",
      subtitle: "Search, filter, and create stock items through the master-data workspace."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <StockItemsPage />;
}
