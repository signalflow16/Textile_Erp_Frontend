"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { RfqDetail } from "@/modules/buying/components/RfqDetail";
import { RfqForm } from "@/modules/buying/components/RfqForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function RfqDetailPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(params.name);
  const editMode = searchParams.get("edit") === "1";

  useEffect(() => {
    setConfig({
      title: editMode ? `Edit RFQ ${decoded}` : `RFQ ${decoded}`,
      subtitle: "RFQ is optional and used for supplier comparison."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [decoded, editMode, setConfig]);

  return editMode ? <RfqForm name={decoded} /> : <RfqDetail name={decoded} />;
}
