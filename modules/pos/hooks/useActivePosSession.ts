"use client";

import { useMemo } from "react";

import { useGetActivePosSessionQuery } from "@/modules/pos/api/posApi";
import { useAppSelector } from "@/core/store/hooks";

export const useActivePosSession = () => {
  const me = useAppSelector((state) => state.auth.me);
  const userId = useMemo(
    () => (typeof me?.email === "string" && me.email ? me.email : (typeof me?.user_id === "string" ? me.user_id : undefined)),
    [me?.email, me?.user_id]
  );

  const query = useGetActivePosSessionQuery(userId);

  return {
    userId,
    session: query.data ?? null,
    isLoading: query.isLoading || query.isFetching,
    isError: query.isError,
    refetch: query.refetch
  };
};

