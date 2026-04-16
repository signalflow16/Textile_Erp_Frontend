"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PurchaseReceiptForm } from "@/modules/buying/components/PurchaseReceiptForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function NewPurchaseReceiptPage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const sourceDoctype = searchParams.get("source_doctype") ?? undefined;
  const sourceName = searchParams.get("source_name") ?? undefined;

  useEffect(() => {
    setConfig({
      title: "Create Purchase Receipt",
      subtitle: "Capture received quantities and warehouse stock-in."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <PurchaseReceiptForm sourceDoctype={sourceDoctype} sourceName={sourceName} />;
}
