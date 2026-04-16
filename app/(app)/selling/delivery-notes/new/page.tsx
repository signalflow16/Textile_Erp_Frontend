"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useAppShell } from "@/core/context/app-shell-context";
import { DeliveryNoteForm } from "@/modules/selling/components/DeliveryNoteForm";

export default function NewDeliveryNotePage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const sourceDoctype = searchParams.get("source_doctype") ?? undefined;
  const sourceName = searchParams.get("source_name") ?? undefined;

  useEffect(() => {
    setConfig({
      title: "Create Delivery Note",
      subtitle: "Create delivery documents from confirmed sales orders."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <DeliveryNoteForm sourceDoctype={sourceDoctype} sourceName={sourceName} />;
}
