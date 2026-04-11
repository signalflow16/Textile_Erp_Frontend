import { useCallback } from "react";

import { useInitializeInitialSetupMutation } from "@/modules/initial-setup/api/initialSetupApi";
import type { InitialSetupPayload } from "@/modules/initial-setup/types/initialSetup";

export const useInitializeInitialSetup = () => {
  const [trigger, state] = useInitializeInitialSetupMutation();

  const submit = useCallback(
    async (payload: InitialSetupPayload) => trigger(payload).unwrap(),
    [trigger]
  );

  return { submit, ...state };
};