import { useCallback } from "react";

import { useSetupCompanyMutation } from "@/modules/initial-setup/api/initialSetupApi";
import type { CompanySetupPayload } from "@/modules/initial-setup/types/initialSetup";

export const useSetupCompany = () => {
  const [trigger, state] = useSetupCompanyMutation();

  const submit = useCallback(
    async (payload: CompanySetupPayload) => trigger(payload).unwrap(),
    [trigger]
  );

  return { submit, ...state };
};