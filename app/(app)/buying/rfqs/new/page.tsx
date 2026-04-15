"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { RfqForm } from "@/modules/buying/components/RfqForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function NewRfqPage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const sourceDoctype = searchParams.get("source_doctype") ?? undefined;
  const sourceName = searchParams.get("source_name") ?? undefined;

  useEffect(() => {
    setConfig({
      title: "Create RFQ",
      subtitle: "Request quotations from one or multiple suppliers."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <RfqForm sourceDoctype={sourceDoctype} sourceName={sourceName} />;
}
