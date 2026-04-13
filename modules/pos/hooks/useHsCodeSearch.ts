import { useMemo, useState } from "react";

import { useSearchPosHsCodesQuery } from "@/modules/pos/api/posApi";

export const useHsCodeSearch = () => {
  const [searchText, setSearchText] = useState("");
  const query = useSearchPosHsCodesQuery(searchText.trim() || undefined);

  return {
    searchText,
    setSearchText,
    options: useMemo(() => query.data ?? [], [query.data]),
    isLoading: query.isLoading || query.isFetching
  };
};
