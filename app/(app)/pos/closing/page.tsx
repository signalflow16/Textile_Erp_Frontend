"use client";

import { useEffect } from "react";
import { PosModulePage } from "@/modules/pos/components/PosModulePage";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PosClosingPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Point of Sale",
      subtitle: "Run ERPNext POS billing for walk-in or registered customers."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <PosModulePage initialModal="closing" />;
}
