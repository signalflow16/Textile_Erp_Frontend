"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SupplierQuotationDetail } from "@/modules/buying/components/SupplierQuotationDetail";
import { SupplierQuotationForm } from "@/modules/buying/components/SupplierQuotationForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function SupplierQuotationDetailPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(params.name);
  const editMode = searchParams.get("edit") === "1";

  useEffect(() => {
    setConfig({
      title: editMode ? `Edit Supplier Quotation ${decoded}` : `Supplier Quotation ${decoded}`,
      subtitle: "Supplier quotation captures vendor-specific offers."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [decoded, editMode, setConfig]);

  return editMode ? <SupplierQuotationForm name={decoded} /> : <SupplierQuotationDetail name={decoded} />;
}
