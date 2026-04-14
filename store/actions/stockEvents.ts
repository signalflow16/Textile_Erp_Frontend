import { createAction } from "@reduxjs/toolkit";

import type { DocumentEvent } from "@/types/document-engine";

export const stockEvents = {
  documentDraftSaved: createAction<DocumentEvent>("stock/events/documentDraftSaved"),
  documentSubmitted: createAction<DocumentEvent>("stock/events/documentSubmitted"),
  documentCancelled: createAction<DocumentEvent>("stock/events/documentCancelled")
};
