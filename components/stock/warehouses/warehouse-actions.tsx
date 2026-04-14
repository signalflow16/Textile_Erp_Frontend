"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space } from "antd";

export function WarehouseActions({
  canAddChild,
  canDelete,
  onEdit,
  onAddChild
  ,
  onDelete
}: {
  canAddChild: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onAddChild: () => void;
  onDelete: () => void;
}) {
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Space size={4} wrap>
        <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
          Edit
        </Button>
        {canAddChild ? (
          <Button size="small" icon={<PlusOutlined />} onClick={onAddChild}>
            Add Child
          </Button>
        ) : null}
        <Popconfirm
          title="Delete warehouse?"
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
