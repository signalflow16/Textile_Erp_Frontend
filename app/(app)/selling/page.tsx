"use client";

import { useEffect } from "react";

import { useAppShell } from "@/core/context/app-shell-context";
import { SellingDashboard } from "@/modules/selling/components/SellingDashboard";

export default function SellingPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Selling Dashboard",
      subtitle: "Manage quotations, confirmed sales orders, delivery execution, and POS access."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <SellingDashboard />;
}
