"use client";

import { useEffect } from "react";
import { StockLedgerPage } from "@/modules/stock/components/reports/stock-ledger-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function StockLedgerRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Stock Ledger",
      subtitle: "Chronological stock movement report using Frappe stock ledger entries."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <StockLedgerPage />;
}
