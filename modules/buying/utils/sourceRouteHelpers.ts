import type { BuyingDocType } from "@/modules/buying/types/buying";

export type SourceReference = {
  doctype: BuyingDocType;
  name: string;
};

export const buildSourceCreateHref = (targetRoute: string, source: SourceReference) =>
  `${targetRoute}?source_doctype=${encodeURIComponent(source.doctype)}&source_name=${encodeURIComponent(source.name)}`;

export const toSourceReferenceText = (source?: SourceReference | null) => {
  if (!source?.doctype || !source?.name) {
    return null;
  }

  return `${source.doctype}: ${source.name}`;
};

