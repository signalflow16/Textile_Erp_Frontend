"use client";

import { useEffect } from "react";
import { WarehouseStockPage } from "@/modules/stock/components/reports/warehouse-stock-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function WarehouseStockRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Warehouse Stock",
      subtitle: "Warehouse totals aggregated from the live Bin snapshot."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <WarehouseStockPage />;
}
