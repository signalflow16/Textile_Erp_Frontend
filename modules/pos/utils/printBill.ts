const ERP_PRINT_FORMAT = "Standard";

export const buildErpNextPrintPreviewUrl = ({
  doctype,
  name
}: {
  doctype: string;
  name: string;
}) => {
  const params = new URLSearchParams({
    doctype,
    name,
    format: ERP_PRINT_FORMAT,
    no_letterhead: "0",
    trigger_print: "0",
    _lang: "en"
  });

  return `/api/frappe/printview?${params.toString()}`;
};

export const openErpNextPrintPreview = (doctype: string, name: string) => {
  const url = buildErpNextPrintPreviewUrl({ doctype, name });
  if (typeof window !== "undefined") {
    const previewWindow = window.open(url, "_blank", "noopener,noreferrer");
    return Boolean(previewWindow);
  }

  return false;
};

export const openErpnextPrintPreview = openErpNextPrintPreview;
