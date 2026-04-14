"use client";

import { useGetPosSessionSummaryQuery } from "@/modules/pos/api/posApi";

export const usePosSessionSummary = (openingEntryName?: string | null) => {
  const query = useGetPosSessionSummaryQuery(openingEntryName ?? "", {
    skip: !openingEntryName
  });

  return {
    summary: query.data,
    isLoading: query.isLoading || query.isFetching,
    isError: query.isError,
    refetch: query.refetch
  };
};
