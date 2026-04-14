"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Form } from "antd";

import { ItemGroupDocumentPage } from "@/components/stock/item-groups/document-page";
import { normalizeItemGroupPayload, toItemGroupFormValues, type ItemGroupFormValues } from "@/components/stock/item-group-helpers";
import { useItemGroupWorkspace } from "@/components/stock/item-groups/use-item-group-workspace";
import {
  createItemGroup,
  fetchItemGroupDetail,
  selectItemGroupParentOptions,
  updateItemGroup
} from "@/store/slices/itemGroupSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function ItemGroupEditor({
  mode,
  itemGroupName,
  parentItemGroup
}: {
  mode: "create" | "edit";
  itemGroupName?: string;
  parentItemGroup?: string;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<ItemGroupFormValues>();
  const workspace = useItemGroupWorkspace(itemGroupName ?? parentItemGroup);

  const parentOptions = useAppSelector((state) => selectItemGroupParentOptions(state, itemGroupName));
  const initialValues = useMemo(
    () =>
      mode === "edit"
        ? toItemGroupFormValues(workspace.selectedItemGroup)
        : {
            item_group_name: "",
            parent_item_group: parentItemGroup,
            is_group: false,
            disabled: false
          },
    [mode, parentItemGroup, workspace.selectedItemGroup]
  );

  useEffect(() => {
    if (mode === "edit" && itemGroupName) {
      void dispatch(fetchItemGroupDetail(itemGroupName));
    }
  }, [dispatch, itemGroupName, mode]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleSubmit = async (values: ItemGroupFormValues) => {
    try {
      const payload = normalizeItemGroupPayload(values);

      if (mode === "create") {
        const created = await dispatch(createItemGroup(payload)).unwrap();
        message.success("Item group created successfully.");
        router.push(`/stock/item-groups?selected=${encodeURIComponent(created.name)}`);
        return;
      }

      if (!itemGroupName) {
        return;
      }

      const updated = await dispatch(updateItemGroup({ itemGroup: itemGroupName, values: payload })).unwrap();
      message.success("Item group updated successfully.");
      router.push(`/stock/item-groups?selected=${encodeURIComponent(updated.name)}`);
    } catch (error) {
      message.error(typeof error === "string" ? error : `Unable to ${mode} item group.`);
    }
  };

  return (
    <div className="page-stack item-group-page-shell">
      {workspace.error ? (
        <Alert type="error" showIcon message={workspace.error} />
      ) : null}

      <ItemGroupDocumentPage
        mode={mode}
          form={form}
          itemGroup={workspace.selectedItemGroup}
          parentOptions={parentOptions}
          loading={workspace.mutationLoading || workspace.detailLoading}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/stock/item-groups")}
          onAddChild={workspace.goToCreate}
        />
    </div>
  );
}
