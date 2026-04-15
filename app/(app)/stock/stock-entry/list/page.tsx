"use client";

import { useEffect } from "react";
import { StockEntryListPage } from "@/modules/stock/components/stock-entry-list-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function StockEntryListRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Stock Entry List",
      subtitle: "Review stock movements, filter by posting date, and inspect entry details."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <StockEntryListPage />;
}
