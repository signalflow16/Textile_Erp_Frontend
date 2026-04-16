"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useAppShell } from "@/core/context/app-shell-context";
import { QuotationDetail } from "@/modules/selling/components/QuotationDetail";
import { QuotationForm } from "@/modules/selling/components/QuotationForm";

export default function QuotationDetailPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(params.name);
  const editMode = searchParams.get("edit") === "1";

  useEffect(() => {
    setConfig({
      title: editMode ? `Edit Quotation ${decoded}` : `Quotation ${decoded}`,
      subtitle: "Quotation is the customer proposal stage."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [decoded, editMode, setConfig]);

  return editMode ? <QuotationForm name={decoded} /> : <QuotationDetail name={decoded} />;
}
