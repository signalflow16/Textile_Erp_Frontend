"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PurchaseOrderForm } from "@/modules/buying/components/PurchaseOrderForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function NewPurchaseOrderPage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const sourceDoctype = searchParams.get("source_doctype") ?? undefined;
  const sourceName = searchParams.get("source_name") ?? undefined;

  useEffect(() => {
    setConfig({
      title: "Create Purchase Order",
      subtitle: "Create and save draft procurement orders."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <PurchaseOrderForm sourceDoctype={sourceDoctype} sourceName={sourceName} />;
}
