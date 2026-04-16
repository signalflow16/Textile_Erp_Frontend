"use client";

import { useEffect } from "react";
import { PosOpeningEntryPage } from "@/modules/pos/components/PosOpeningEntryPage";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PosOpeningPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "POS Opening Entry",
      subtitle: "Start POS session before billing."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <PosOpeningEntryPage />;
}
