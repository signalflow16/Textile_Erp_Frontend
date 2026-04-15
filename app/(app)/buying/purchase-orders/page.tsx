"use client";

import { useEffect } from "react";
import { PurchaseOrderList } from "@/modules/buying/components/PurchaseOrderList";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PurchaseOrdersPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Purchase Orders",
      subtitle: "Confirm supplier procurement and schedule delivery."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <PurchaseOrderList />;
}
