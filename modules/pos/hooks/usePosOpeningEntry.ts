"use client";

import { useCallback } from "react";

import { useCreatePosOpeningEntryMutation, useListPosProfilesQuery } from "@/modules/pos/api/posApi";
import type { PosOpeningEntryPayload } from "@/modules/pos/types/pos";

export const usePosOpeningEntry = () => {
  const profilesQuery = useListPosProfilesQuery();
  const [createOpeningEntry, createState] = useCreatePosOpeningEntryMutation();

  const startSession = useCallback(
    async (payload: PosOpeningEntryPayload) => createOpeningEntry(payload).unwrap(),
    [createOpeningEntry]
  );

  return {
    profiles: profilesQuery.data ?? [],
    isProfilesLoading: profilesQuery.isLoading || profilesQuery.isFetching,
    isStarting: createState.isLoading,
    startSession
  };
};
