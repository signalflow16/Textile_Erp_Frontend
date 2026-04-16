"use client";

import { useEffect } from "react";
import { ItemShortagePage } from "@/modules/stock/components/reports/item-shortage-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function ItemShortageRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Item Shortage",
      subtitle: "Low stock exceptions with manual threshold fallback for current inventory."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <ItemShortagePage />;
}
