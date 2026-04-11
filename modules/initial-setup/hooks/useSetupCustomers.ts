import { useCallback } from "react";

import { useSetupCustomersMutation } from "@/modules/initial-setup/api/initialSetupApi";
import type { CustomersSetupPayload } from "@/modules/initial-setup/types/initialSetup";

export const useSetupCustomers = () => {
  const [trigger, state] = useSetupCustomersMutation();

  const submit = useCallback(
    async (payload: CustomersSetupPayload) => trigger(payload).unwrap(),
    [trigger]
  );

  return { submit, ...state };
};