"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SupplierQuotationForm } from "@/modules/buying/components/SupplierQuotationForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function NewSupplierQuotationPage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const sourceDoctype = searchParams.get("source_doctype") ?? undefined;
  const sourceName = searchParams.get("source_name") ?? undefined;

  useEffect(() => {
    setConfig({
      title: "Create Supplier Quotation",
      subtitle: "Record supplier quotation details for decision making."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <SupplierQuotationForm sourceDoctype={sourceDoctype} sourceName={sourceName} />;
}
