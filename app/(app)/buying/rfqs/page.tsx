"use client";

import { useEffect } from "react";
import { RfqList } from "@/modules/buying/components/RfqList";
import { useAppShell } from "@/core/context/app-shell-context";

export default function RfqsPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Request for Quotations",
      subtitle: "Collect supplier quotations for demand items."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <RfqList />;
}
