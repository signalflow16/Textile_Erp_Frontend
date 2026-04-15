"use client";

import { useEffect } from "react";
import { StockDashboardPage } from "@/modules/stock/components/stock-dashboard-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function StockPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Stock Dashboard",
      subtitle: "Live inventory visibility, warehouse value trends, and stock movement monitoring."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <StockDashboardPage />;
}
