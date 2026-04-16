"use client";

import { useEffect } from "react";
import { PosClosingEntryPage } from "@/modules/pos/components/PosClosingEntryPage";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PosClosingPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "POS Closing Entry",
      subtitle: "End POS session and verify collected amount."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <PosClosingEntryPage />;
}
