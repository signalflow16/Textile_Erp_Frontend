"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useAppShell } from "@/core/context/app-shell-context";
import { DeliveryNoteDetail } from "@/modules/selling/components/DeliveryNoteDetail";
import { DeliveryNoteForm } from "@/modules/selling/components/DeliveryNoteForm";

export default function DeliveryNoteDetailPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(params.name);
  const editMode = searchParams.get("edit") === "1";

  useEffect(() => {
    setConfig({
      title: editMode ? `Edit Delivery Note ${decoded}` : `Delivery Note ${decoded}`,
      subtitle: "Delivery Note captures fulfillment and dispatch."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [decoded, editMode, setConfig]);

  return editMode ? <DeliveryNoteForm name={decoded} /> : <DeliveryNoteDetail name={decoded} />;
}
