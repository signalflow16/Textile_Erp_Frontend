"use client";

import { useEffect } from "react";
import { BuyingDashboard } from "@/modules/buying/components/BuyingDashboard";
import { useAppShell } from "@/core/context/app-shell-context";

export default function BuyingDashboardPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Buying Dashboard",
      subtitle: "Track textile procurement from demand planning through ordering, receipt, and supplier billing."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <BuyingDashboard />;
}
