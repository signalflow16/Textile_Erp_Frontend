"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PurchaseInvoiceForm } from "@/modules/buying/components/PurchaseInvoiceForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function NewPurchaseInvoicePage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const sourceDoctype = searchParams.get("source_doctype") ?? undefined;
  const sourceName = searchParams.get("source_name") ?? undefined;

  useEffect(() => {
    setConfig({
      title: "Create Purchase Invoice",
      subtitle: "Record invoice-level payable details for suppliers."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <PurchaseInvoiceForm sourceDoctype={sourceDoctype} sourceName={sourceName} />;
}
