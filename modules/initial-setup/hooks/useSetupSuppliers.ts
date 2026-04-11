import { useCallback } from "react";

import { useSetupSuppliersMutation } from "@/modules/initial-setup/api/initialSetupApi";
import type { SuppliersSetupPayload } from "@/modules/initial-setup/types/initialSetup";

export const useSetupSuppliers = () => {
  const [trigger, state] = useSetupSuppliersMutation();

  const submit = useCallback(
    async (payload: SuppliersSetupPayload) => trigger(payload).unwrap(),
    [trigger]
  );

  return { submit, ...state };
};