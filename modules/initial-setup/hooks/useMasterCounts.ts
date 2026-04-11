import { useMemo } from "react";

import { useGetMasterCountsQuery } from "@/modules/initial-setup/api/initialSetupApi";
import { normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";

export const useMasterCounts = () => {
  const query = useGetMasterCountsQuery();

  const envelopeError = useMemo(
    () => (query.data ? normalizeSetupEnvelopeError(query.data, "Unable to fetch master counts.") : null),
    [query.data]
  );

  return {
    ...query,
    counts: query.data?.ok ? query.data.data : null,
    envelopeError
  };
};