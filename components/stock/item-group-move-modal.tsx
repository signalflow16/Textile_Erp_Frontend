"use client";

import { useEffect } from "react";
import { App, Form, Modal, Select, Typography } from "antd";

import { getErrorMessage } from "@/components/stock/item-group-helpers";
import { useGetItemGroupLookupsQuery, useMoveItemGroupMutation } from "@/store/api/frappeApi";
import type { ItemGroupDocument } from "@/types/item-group";

const { Text } = Typography;
const ROOT_VALUE = "__root__";

type ItemGroupMoveModalProps = {
  open: boolean;
  itemGroup?: ItemGroupDocument;
  onClose: () => void;
  onSuccess: (itemGroup: ItemGroupDocument) => void;
};

export function ItemGroupMoveModal({ open, itemGroup, onClose, onSuccess }: ItemGroupMoveModalProps) {
  const [form] = Form.useForm<{ new_parent_item_group: string }>();
  const { message } = App.useApp();
  const { data: lookups, isLoading } = useGetItemGroupLookupsQuery(
    itemGroup?.name ? { currentItemGroup: itemGroup.name } : undefined,
    { skip: !open || !itemGroup?.name }
  );
  const [moveItemGroup, moveState] = useMoveItemGroupMutation();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      new_parent_item_group: itemGroup?.parent_item_group ?? ROOT_VALUE
    });
  }, [form, itemGroup, open]);

  const onFinish = async (values: { new_parent_item_group: string }) => {
    if (!itemGroup?.name) {
      return;
    }

    try {
      const moved = await moveItemGroup({
        itemGroup: itemGroup.name,
        newParentItemGroup: values.new_parent_item_group === ROOT_VALUE ? "" : values.new_parent_item_group
      }).unwrap();
      message.success("Item group moved successfully.");
      onSuccess(moved);
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to move item group."));
    }
  };

  return (
    <Modal
      title={`Move ${itemGroup?.item_group_name ?? "Item Group"}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Move"
      okButtonProps={{ loading: moveState.isLoading }}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Text type="secondary">
          Choose a new parent. The backend already excludes invalid targets such as self and descendants.
        </Text>
        <Form.Item
          label="New Parent"
          name="new_parent_item_group"
          style={{ marginTop: 16 }}
          rules={[{ required: true, message: "Choose a destination." }]}
        >
          <Select
            loading={isLoading}
            options={[
              { label: "Move to root", value: ROOT_VALUE },
              ...(lookups?.parent_candidates ?? [])
            ]}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
