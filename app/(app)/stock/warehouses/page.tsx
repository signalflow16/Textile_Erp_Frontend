"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { WarehouseWorkspace } from "@/modules/stock/components/warehouses/workspace";
import { useAppShell } from "@/core/context/app-shell-context";

export default function StockWarehousesRoute() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const selected = searchParams.get("selected");

  useEffect(() => {
    setConfig({
      title: "Warehouses",
      subtitle: "Tree-based warehouse management with page-based edit and root-only child creation."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <WarehouseWorkspace selectedWarehouse={selected ? decodeURIComponent(selected) : undefined} />;
}
