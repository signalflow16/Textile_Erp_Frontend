import { useMemo } from "react";

import { useValidateSetupReadinessForItemCreationQuery } from "@/modules/initial-setup/api/initialSetupApi";
import { normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";
import { toReadiness } from "@/modules/initial-setup/utils/statusMapper";

export const useSetupReadiness = () => {
  const query = useValidateSetupReadinessForItemCreationQuery();

  const envelopeError = useMemo(
    () => (query.data ? normalizeSetupEnvelopeError(query.data, "Unable to validate setup readiness.") : null),
    [query.data]
  );

  const readinessPayload = query.data?.ok ? query.data.data : null;

  return {
    ...query,
    readiness: readinessPayload,
    isReady: toReadiness(readinessPayload as Record<string, unknown> | null),
    envelopeError
  };
};