"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MaterialRequestDetail } from "@/modules/buying/components/MaterialRequestDetail";
import { MaterialRequestForm } from "@/modules/buying/components/MaterialRequestForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function MaterialRequestDetailPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(params.name);
  const editMode = searchParams.get("edit") === "1";

  useEffect(() => {
    setConfig({
      title: editMode ? `Edit Material Request ${decoded}` : `Material Request ${decoded}`,
      subtitle: "Material Request is planning-stage procurement demand."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [decoded, editMode, setConfig]);

  return editMode ? <MaterialRequestForm name={decoded} /> : <MaterialRequestDetail name={decoded} />;
}
