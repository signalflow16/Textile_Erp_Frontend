import { useCallback } from "react";

import { useSetupWarehousesMutation } from "@/modules/initial-setup/api/initialSetupApi";
import type { WarehousesSetupPayload } from "@/modules/initial-setup/types/initialSetup";

export const useSetupWarehouses = () => {
  const [trigger, state] = useSetupWarehousesMutation();

  const submit = useCallback(
    async (payload: WarehousesSetupPayload) => trigger(payload).unwrap(),
    [trigger]
  );

  return { submit, ...state };
};