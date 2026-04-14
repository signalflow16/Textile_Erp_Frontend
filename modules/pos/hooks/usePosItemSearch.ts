import { useCallback, useEffect, useMemo, useState } from "react";

import { useLazySearchPosItemsQuery, useSearchPosItemsQuery } from "@/modules/pos/api/posApi";
import type { PosItemLookup } from "@/modules/pos/types/pos";

const normalize = (value: string) => value.trim().toLowerCase();

const pickBestBarcodeMatch = (rows: PosItemLookup[], token: string) => {
  const exact = rows.find((row) => normalize(row.barcode ?? "") === normalize(token));
  if (exact) {
    return exact;
  }

  const exactCode = rows.find((row) => normalize(row.value) === normalize(token));
  if (exactCode) {
    return exactCode;
  }

  return rows[0];
};

const useDebouncedValue = (value: string, delay = 220) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
};

export const usePosItemSearch = (onSelectItem: (item: PosItemLookup) => void) => {
  const [searchText, setSearchText] = useState("");
  const [barcodeText, setBarcodeText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText);

  const searchQuery = useSearchPosItemsQuery(debouncedSearch || undefined);
  const [runBarcodeLookup, barcodeState] = useLazySearchPosItemsQuery();

  const options = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);

  const handleAddFirstSearchItem = useCallback(() => {
    if (!options.length) {
      return;
    }

    onSelectItem(options[0]);
  }, [onSelectItem, options]);

  const handleScanBarcode = useCallback(async () => {
    const token = barcodeText.trim();
    if (!token) {
      return;
    }

    const rows = await runBarcodeLookup(token, true).unwrap();
    const selected = pickBestBarcodeMatch(rows, token);
    if (selected) {
      onSelectItem(selected);
      setBarcodeText("");
    }
  }, [barcodeText, onSelectItem, runBarcodeLookup]);

  return {
    searchText,
    setSearchText,
    barcodeText,
    setBarcodeText,
    options,
    isSearching: searchQuery.isLoading || searchQuery.isFetching,
    isBarcodeSearching: barcodeState.isLoading,
    handleAddFirstSearchItem,
    handleScanBarcode
  };
};
