"use client";

import { Alert, Skeleton } from "antd";

import { ItemForm } from "./item-form";
import { useGetItemQuery } from "@/core/api/frappeApi";

export function StoreHydratedItemPage({ itemCode }: { itemCode: string }) {
  const { data, isLoading, error } = useGetItemQuery(itemCode);

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (error || !data) {
    return (
      <Alert
        type="error"
        message="Item could not be loaded"
        description="Confirm the item exists and the ERPNext user has permission to access it."
        showIcon
      />
    );
  }

  return <ItemForm mode="edit" itemCode={itemCode} initialValues={data} />;
}
