"use client";

import { useEffect } from "react";
import { SupplierQuotationList } from "@/modules/buying/components/SupplierQuotationList";
import { useAppShell } from "@/core/context/app-shell-context";

export default function SupplierQuotationsPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Supplier Quotations",
      subtitle: "Capture vendor rates and terms."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <SupplierQuotationList />;
}
