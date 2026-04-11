"use client";

import { App, Modal, Typography } from "antd";

import { formatDependencySummary, getErrorMessage } from "@/components/stock/item-group-helpers";
import { useDeleteItemGroupMutation } from "@/store/api/frappeApi";
import type { ItemGroupDocument } from "@/types/item-group";

const { Paragraph, Text } = Typography;

type ItemGroupDeleteModalProps = {
  open: boolean;
  itemGroup?: ItemGroupDocument;
  onClose: () => void;
  onSuccess: () => void;
};

export function ItemGroupDeleteModal({ open, itemGroup, onClose, onSuccess }: ItemGroupDeleteModalProps) {
  const { message } = App.useApp();
  const [deleteItemGroup, deleteState] = useDeleteItemGroupMutation();

  const onDelete = async () => {
    if (!itemGroup?.name) {
      return;
    }

    try {
      await deleteItemGroup(itemGroup.name).unwrap();
      message.success("Item group deleted successfully.");
      onSuccess();
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to delete item group."));
    }
  };

  return (
    <Modal
      title={`Delete ${itemGroup?.item_group_name ?? "Item Group"}`}
      open={open}
      onCancel={onClose}
      onOk={onDelete}
      okText="Delete"
      okButtonProps={{ danger: true, loading: deleteState.isLoading }}
      destroyOnClose
    >
      <Paragraph>
        This action removes the selected item group. The backend will block deletion when child groups or linked items
        still exist.
      </Paragraph>
      <Text type="secondary">{formatDependencySummary(itemGroup?.dependency_counts)}</Text>
    </Modal>
  );
}
