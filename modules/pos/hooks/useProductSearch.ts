import { useMemo, useState } from "react";

import { useSearchPosItemsQuery } from "@/modules/pos/api/posApi";
import type { PosItemLookup } from "@/modules/pos/types/pos";

export const useProductSearch = () => {
  const [searchText, setSearchText] = useState("");
  const query = useSearchPosItemsQuery(searchText.trim() || undefined);

  const options = useMemo<PosItemLookup[]>(() => {
    const merged = (query.data ?? [])
      .filter((row) => typeof row.item_name === "string" && row.item_name.trim().length > 0)
      .map((row) => ({
        ...row,
        label: row.item_name!.trim()
      }));
    const seen = new Set<string>();
    return merged.filter((row) => {
      const key = row.value;
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [query.data]);

  return {
    searchText,
    setSearchText,
    options,
    isLoading: query.isLoading || query.isFetching
  };
};
