"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { WarehouseEditor } from "@/modules/stock/components/warehouses/editor";
import { useAppShell } from "@/core/context/app-shell-context";

export default function EditWarehousePage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ id: string }>();
  const warehouseName = decodeURIComponent(params.id);

  useEffect(() => {
    setConfig({
      title: warehouseName,
      subtitle: "Review warehouse information and update it from the document page."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig, warehouseName]);

  return <WarehouseEditor mode="edit" warehouseName={warehouseName} />;
}
