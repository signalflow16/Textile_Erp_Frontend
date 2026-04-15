"use client";

import { useCallback } from "react";

import { useCreatePosClosingEntryMutation } from "@/modules/pos/api/posApi";
import type { PosClosingEntryPayload } from "@/modules/pos/types/pos";

export const usePosClosingEntry = () => {
  const [createClosingEntry, closingState] = useCreatePosClosingEntryMutation();

  const closeSession = useCallback(
    async (payload: PosClosingEntryPayload) => createClosingEntry(payload).unwrap(),
    [createClosingEntry]
  );

  return {
    isClosing: closingState.isLoading,
    closeSession
  };
};
