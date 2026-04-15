"use client";

import { useEffect } from "react";
import { StockPartiesPage } from "@/modules/stock/components/stock-parties-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function StockPartiesRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Parties"
    });

    return () => {
      setConfig({
        title: ""
      });
    };
  }, [setConfig]);

  return <StockPartiesPage />;
}
