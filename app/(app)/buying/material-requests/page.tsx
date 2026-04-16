"use client";

import { useEffect } from "react";
import { useAppShell } from "@/core/context/app-shell-context";
import { MaterialRequestList } from "@/modules/buying/components/MaterialRequestList";

export default function MaterialRequestsPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Material Requests",
      subtitle: "Plan purchase demand for textile stock replenishment."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, []);

  return <MaterialRequestList />;
}
