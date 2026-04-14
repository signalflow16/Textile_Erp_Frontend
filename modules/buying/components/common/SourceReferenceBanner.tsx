"use client";

import { Alert } from "antd";

import type { SourceReference } from "@/modules/buying/utils/sourceRouteHelpers";
import { toSourceReferenceText } from "@/modules/buying/utils/sourceRouteHelpers";

export function SourceReferenceBanner({
  source,
  prefix = "Prefilled from"
}: {
  source?: SourceReference | null;
  prefix?: string;
}) {
  const text = toSourceReferenceText(source);
  if (!text) {
    return null;
  }

  return <Alert type="success" showIcon message={`${prefix} ${text}`} />;
}

