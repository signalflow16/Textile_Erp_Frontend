"use client";

import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  FormOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { Button, Input, Popconfirm, Space } from "antd";

export function GroupActions({
  itemGroupName,
  canDelete,
  canAddChild,
  isRenaming,
  renameValue,
  renameLoading,
  onRenameValueChange,
  onRenameStart,
  onRenameCancel,
  onRenameSubmit,
  onEdit,
  onAddChild,
  onDelete
}: {
  itemGroupName: string;
  canDelete: boolean;
  canAddChild: boolean;
  isRenaming: boolean;
  renameValue: string;
  renameLoading: boolean;
  onRenameValueChange: (value: string) => void;
  onRenameStart: () => void;
  onRenameCancel: () => void;
  onRenameSubmit: () => void;
  onEdit: () => void;
  onAddChild: () => void;
  onDelete: () => void;
}) {
  if (isRenaming) {
    return (
      <div onClick={(event) => event.stopPropagation()}>
        <Space.Compact className="item-group-inline-rename">
          <Input
            size="small"
            value={renameValue}
            onChange={(event) => onRenameValueChange(event.target.value)}
            onPressEnter={onRenameSubmit}
            placeholder="Rename item group"
          />
          <Button size="small" type="primary" icon={<CheckOutlined />} loading={renameLoading} onClick={onRenameSubmit} />
          <Button size="small" icon={<CloseOutlined />} onClick={onRenameCancel} />
        </Space.Compact>
      </div>
    );
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Space size={4} wrap>
        <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
          Edit
        </Button>
        <Button size="small" icon={<PlusOutlined />} onClick={onAddChild} disabled={!canAddChild}>
          Add Child
        </Button>
        <Button size="small" icon={<FormOutlined />} onClick={onRenameStart}>
          Rename
        </Button>
        <Popconfirm
          title={`Delete ${itemGroupName}?`}
          description="This action cannot be undone."
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={onDelete}
        >
          <Button size="small" danger icon={<DeleteOutlined />} disabled={!canDelete}>
            Delete
          </Button>
        </Popconfirm>
      </Space>
    </div>
  );
}
