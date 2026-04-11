"use client";

import { useEffect } from "react";
import { App, Button, Checkbox, Drawer, Form, Input, Select, Space, Typography } from "antd";

import {
  getErrorMessage,
  normalizeItemGroupPayload,
  toItemGroupFormValues,
  type ItemGroupFormValues
} from "@/components/stock/item-group-helpers";
import {
  useCreateItemGroupMutation,
  useGetItemGroupLookupsQuery,
  useUpdateItemGroupMutation
} from "@/store/api/frappeApi";
import type { ItemGroupDocument } from "@/types/item-group";

const { Text } = Typography;

type ItemGroupFormDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  itemGroup?: ItemGroupDocument;
  initialParentItemGroup?: string;
  onClose: () => void;
  onSuccess: (itemGroup: ItemGroupDocument) => void;
};

const ROOT_VALUE = "__root__";

export function ItemGroupFormDrawer({
  open,
  mode,
  itemGroup,
  initialParentItemGroup,
  onClose,
  onSuccess
}: ItemGroupFormDrawerProps) {
  const [form] = Form.useForm<ItemGroupFormValues>();
  const { message } = App.useApp();
  const { data: lookups, isLoading: lookupsLoading } = useGetItemGroupLookupsQuery(
    mode === "edit" && itemGroup?.name ? { currentItemGroup: itemGroup.name } : undefined,
    { skip: !open }
  );
  const [createItemGroup, createState] = useCreateItemGroupMutation();
  const [updateItemGroup, updateState] = useUpdateItemGroupMutation();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      ...toItemGroupFormValues(itemGroup),
      parent_item_group:
        mode === "create"
          ? initialParentItemGroup ?? ROOT_VALUE
          : itemGroup?.parent_item_group ?? ROOT_VALUE
    });
  }, [form, initialParentItemGroup, itemGroup, mode, open]);

  const saving = createState.isLoading || updateState.isLoading;
  const parentOptions = [
    { label: "Move to root", value: ROOT_VALUE },
    ...(lookups?.parent_candidates ?? [])
  ];

  const onFinish = async (values: ItemGroupFormValues) => {
    try {
      const payload = normalizeItemGroupPayload({
        ...values,
        parent_item_group: values.parent_item_group === ROOT_VALUE ? "" : values.parent_item_group
      });

      if (mode === "create") {
        const created = await createItemGroup(payload).unwrap();
        message.success("Item group created successfully.");
        onSuccess(created);
        return;
      }

      if (!itemGroup?.name) {
        return;
      }

      const updated = await updateItemGroup({ itemGroup: itemGroup.name, values: payload }).unwrap();
      message.success("Item group updated successfully.");
      onSuccess(updated);
    } catch (error) {
      message.error(getErrorMessage(error, `Unable to ${mode === "create" ? "create" : "update"} item group.`));
    }
  };

  return (
    <Drawer
      title={
        mode === "create"
          ? initialParentItemGroup
            ? "Add Child Item Group"
            : "New Item Group"
          : `Edit ${itemGroup?.item_group_name ?? "Item Group"}`
      }
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </Space>
      }
    >
      <Form<ItemGroupFormValues> form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Item Group Name"
          name="item_group_name"
          rules={[{ required: true, message: "Item Group Name is required." }]}
        >
          <Input size="large" placeholder="Raw Material" />
        </Form.Item>

        <Form.Item label="Parent Item Group" name="parent_item_group">
          <Select
            allowClear={false}
            size="large"
            loading={lookupsLoading}
            options={parentOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item label="Image URL" name="image">
          <Input size="large" placeholder="Not available on the standard ERPNext Item Group resource" disabled />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={5} placeholder="Not available on the standard ERPNext Item Group resource" disabled />
        </Form.Item>

        <Text type="secondary">
          Standard ERPNext Item Group migration currently supports hierarchy fields only: name, parent, and group flag.
        </Text>

        <Form.Item name="is_group" valuePropName="checked">
          <Checkbox>Acts as a parent group</Checkbox>
        </Form.Item>

        <Form.Item name="disabled" valuePropName="checked">
          <Checkbox disabled>Disabled</Checkbox>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
