import { useCallback } from "react";

import { useSetupUomsMutation } from "@/modules/initial-setup/api/initialSetupApi";
import type { UomsSetupPayload } from "@/modules/initial-setup/types/initialSetup";

export const useSetupUoms = () => {
  const [trigger, state] = useSetupUomsMutation();

  const submit = useCallback(
    async (payload: UomsSetupPayload) => trigger(payload).unwrap(),
    [trigger]
  );

  return { submit, ...state };
};