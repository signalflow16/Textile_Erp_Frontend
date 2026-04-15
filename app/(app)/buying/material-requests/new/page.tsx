"use client";

import { useEffect } from "react";
import { MaterialRequestForm } from "@/modules/buying/components/MaterialRequestForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function NewMaterialRequestPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Create Material Request",
      subtitle: "Capture demand before vendor procurement."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <MaterialRequestForm />;
}
