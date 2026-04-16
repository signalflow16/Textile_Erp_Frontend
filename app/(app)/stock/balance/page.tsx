"use client";

import { useEffect } from "react";
import { StockBalancePage } from "@/modules/stock/components/reports/stock-balance-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function StockBalanceRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Stock Balance",
      subtitle: "Live quantity and stock value visibility by item and warehouse."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <StockBalancePage />;
}
