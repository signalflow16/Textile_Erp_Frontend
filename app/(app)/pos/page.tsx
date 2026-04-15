"use client";

import { useEffect } from "react";
import { PosModulePage } from "@/modules/pos/components/PosModulePage";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PosPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "POS Billing",
      subtitle: "Create bill quickly for walk-in or registered customers."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <PosModulePage />;
}
