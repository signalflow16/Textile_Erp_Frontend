import { useMemo } from "react";

import { useGetInitialSetupStatusQuery } from "@/modules/initial-setup/api/initialSetupApi";
import { normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";

export const useInitialSetupStatus = () => {
  const query = useGetInitialSetupStatusQuery();

  const envelopeError = useMemo(
    () => (query.data ? normalizeSetupEnvelopeError(query.data, "Unable to fetch setup status.") : null),
    [query.data]
  );

  return {
    ...query,
    status: query.data?.ok ? query.data.data : null,
    envelopeError
  };
};