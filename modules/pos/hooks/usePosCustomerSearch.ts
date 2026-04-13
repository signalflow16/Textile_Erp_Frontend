import { useMemo } from "react";

import { useListPosCustomersQuery } from "@/modules/pos/api/posApi";
import type { PosCustomerLookup } from "@/modules/pos/types/pos";

const WALK_IN_CUSTOMER = "Walk-in Customer";

export const usePosCustomerSearch = () => {
  const query = useListPosCustomersQuery();

  const customers = useMemo<PosCustomerLookup[]>(() => {
    const rows = query.data ?? [];
    const hasWalkIn = rows.some((entry) => entry.value === WALK_IN_CUSTOMER);
    if (hasWalkIn) {
      return rows;
    }

    return [{ label: WALK_IN_CUSTOMER, value: WALK_IN_CUSTOMER }, ...rows];
  }, [query.data]);

  return {
    customers,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
  };
};

export const defaultWalkInCustomer = WALK_IN_CUSTOMER;
