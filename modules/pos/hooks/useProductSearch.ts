import { useMemo, useState } from "react";

import { useGetBuyingMastersQuery } from "@/modules/buying/api/buyingApi";
import { useSearchPosItemsQuery } from "@/modules/pos/api/posApi";
import type { PosItemLookup } from "@/modules/pos/types/pos";

export const useProductSearch = () => {
  const [searchText, setSearchText] = useState("");
  const token = searchText.trim().toLowerCase();
  const query = useSearchPosItemsQuery(searchText.trim() || undefined);
  const buyingMasters = useGetBuyingMastersQuery();

  const options = useMemo<PosItemLookup[]>(() => {
    const remote = query.data ?? [];
    const fallback = (buyingMasters.data?.items ?? [])
      .filter((row) => {
        if (!token) {
          return true;
        }
        return row.label.toLowerCase().includes(token) || row.value.toLowerCase().includes(token);
      })
      .map((row) => ({
        label: row.label,
        value: row.value,
        item_name: row.label
      }));
    const merged = [...remote, ...fallback];
    const seen = new Set<string>();
    return merged.filter((row) => {
      const key = row.value;
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [buyingMasters.data?.items, query.data]);

  return {
    searchText,
    setSearchText,
    options,
    isLoading: query.isLoading || query.isFetching || buyingMasters.isLoading || buyingMasters.isFetching
  };
};
