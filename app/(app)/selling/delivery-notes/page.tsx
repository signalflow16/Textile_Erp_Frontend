"use client";

import { useEffect } from "react";

import { useAppShell } from "@/core/context/app-shell-context";
import { DeliveryNoteList } from "@/modules/selling/components/DeliveryNoteList";

export default function DeliveryNotesPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Delivery Notes",
      subtitle: "Track dispatch and stock-out documents for customer fulfillment."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <DeliveryNoteList />;
}
