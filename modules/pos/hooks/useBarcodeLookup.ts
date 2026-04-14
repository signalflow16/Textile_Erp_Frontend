import { useCallback } from "react";

import { useLazySearchPosItemsQuery } from "@/modules/pos/api/posApi";
import type { PosItemLookup } from "@/modules/pos/types/pos";

const normalize = (value?: string) => (value ?? "").trim().toLowerCase();

export const useBarcodeLookup = () => {
  const [trigger, state] = useLazySearchPosItemsQuery();

  const lookup = useCallback(
    async (token: string): Promise<PosItemLookup | null> => {
      const query = token.trim();
      if (!query) {
        return null;
      }

      const rows = await trigger(query, true).unwrap();
      const byBarcode = rows.find((row) => normalize(row.barcode) === normalize(query));
      if (byBarcode) {
        return byBarcode;
      }

      const byCode = rows.find((row) => normalize(row.value) === normalize(query));
      return byCode ?? rows[0] ?? null;
    },
    [trigger]
  );

  return {
    lookup,
    isLoading: state.isLoading
  };
};
