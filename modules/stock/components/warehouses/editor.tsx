"use client";

import { useEffect, useMemo } from "react";
import { Alert, App, Form } from "antd";
import { useRouter } from "next/navigation";

import { WarehouseDocumentPage } from "./document-page";
import { useWarehouseWorkspace } from "./use-warehouse-workspace";
import {
  createWarehouse,
  selectAllWarehouses,
  updateWarehouse
} from "@/modules/stock/store/warehouseSlice";
import { useAppDispatch, useAppSelector } from "@/core/store/hooks";
import type { WarehouseCreateValues } from "@/modules/stock/types/master-data";

export function WarehouseEditor({
  mode,
  warehouseName,
  parentWarehouse
}: {
  mode: "create" | "edit";
  warehouseName?: string;
  parentWarehouse?: string;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<WarehouseCreateValues>();
  const workspace = useWarehouseWorkspace(warehouseName ?? parentWarehouse);
  const allWarehouses = useAppSelector(selectAllWarehouses);

  const parentOptions = useMemo(
    () =>
      allWarehouses
        .filter((warehouse) => (warehouseName ? warehouse.name !== warehouseName : true))
        .sort((left, right) => (left.warehouse_name ?? left.name).localeCompare(right.warehouse_name ?? right.name))
        .map((warehouse) => ({
          value: warehouse.name,
          label: warehouse.warehouse_name || warehouse.name
        })),
    [allWarehouses, warehouseName]
  );

  const initialValues = useMemo(
    () =>
      mode === "edit"
        ? {
            warehouse_name: workspace.warehouse?.warehouse_name || "",
            parent_warehouse: workspace.warehouse?.parent_warehouse || undefined,
            company: workspace.warehouse?.company || undefined,
            is_group: Boolean(workspace.warehouse?.is_group)
          }
        : {
            warehouse_name: "",
            parent_warehouse: parentWarehouse,
            company: undefined,
            is_group: false
          },
    [mode, parentWarehouse, workspace.warehouse]
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleSubmit = async (values: WarehouseCreateValues) => {
    try {
      if (mode === "create") {
        const created = await dispatch(createWarehouse(values)).unwrap();
        message.success("Warehouse created successfully.");
        router.push(`/stock/warehouses?selected=${encodeURIComponent(created.name)}`);
        return;
      }

      if (!warehouseName) {
        return;
      }

      const updated = await dispatch(updateWarehouse({ warehouse: warehouseName, values })).unwrap();
      message.success("Warehouse updated successfully.");
      router.push(`/stock/warehouses?selected=${encodeURIComponent(updated.name)}`);
    } catch (error) {
      message.error(typeof error === "string" ? error : `Unable to ${mode} warehouse.`);
    }
  };

  return (
    <div className="page-stack item-group-page-shell">
      {workspace.error ? <Alert type="error" showIcon message={workspace.error} /> : null}

      <WarehouseDocumentPage
        mode={mode}
        form={form}
        warehouse={workspace.warehouse}
        parentOptions={parentOptions}
        companyOptions={workspace.companies}
        loading={workspace.mutationLoading || workspace.detailLoading}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/stock/warehouses")}
        onAddChild={workspace.goToCreate}
      />
    </div>
  );
}

