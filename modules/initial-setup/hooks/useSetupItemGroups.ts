import { useCallback } from "react";

import { useSetupItemGroupsMutation } from "@/modules/initial-setup/api/initialSetupApi";
import type { ItemGroupsSetupPayload } from "@/modules/initial-setup/types/initialSetup";

export const useSetupItemGroups = () => {
  const [trigger, state] = useSetupItemGroupsMutation();

  const submit = useCallback(
    async (payload: ItemGroupsSetupPayload) => trigger(payload).unwrap(),
    [trigger]
  );

  return { submit, ...state };
};