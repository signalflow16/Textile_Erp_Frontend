"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { WarehouseEditor } from "@/modules/stock/components/warehouses/editor";
import { useAppShell } from "@/core/context/app-shell-context";

export default function CreateWarehousePage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const parent = searchParams.get("parent");

  useEffect(() => {
    setConfig({
      title: "Create Warehouse",
      subtitle: "Create a new warehouse from a document-style page."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <WarehouseEditor mode="create" parentWarehouse={parent ? decodeURIComponent(parent) : undefined} />;
}
