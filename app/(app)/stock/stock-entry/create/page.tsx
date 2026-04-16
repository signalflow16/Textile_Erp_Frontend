"use client";

import { useEffect } from "react";
import { StockEntryForm } from "@/modules/stock/components/stock-entry-form";
import { useAppShell } from "@/core/context/app-shell-context";

export default function StockEntryCreatePage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Create Stock Entry",
      subtitle: "Create stock movements with ERPNext-compatible posting data and item rows."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <StockEntryForm />;
}
