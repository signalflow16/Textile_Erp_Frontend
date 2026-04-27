"use client";

import { useMemo } from "react";

import { useListPosCustomersQuery } from "@/modules/pos/api/posApi";
import type { PosCustomerLookup } from "@/modules/pos/types/pos";

const DEFAULT_POS_CUSTOMER = "";

export const usePosCustomerSearch = () => {
  const query = useListPosCustomersQuery();

  const customers = useMemo<PosCustomerLookup[]>(() => query.data ?? [], [query.data]);

  return {
    customers,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
  };
};

export const defaultWalkInCustomer = DEFAULT_POS_CUSTOMER;
