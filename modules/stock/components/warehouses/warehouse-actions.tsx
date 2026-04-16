"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Tooltip } from "antd";

export function WarehouseActions({
  canAddChild,
  canDelete,
  deleteDisabledReason,
  deleteLoading,
  onEdit,
  onAddChild
  ,
  onDelete
}: {
  canAddChild: boolean;
  canDelete: boolean;
  deleteDisabledReason?: string;
  deleteLoading?: boolean;
  onEdit: () => void;
  onAddChild: () => void;
  onDelete: () => void;
}) {
  const deleteDisabled = !canDelete || Boolean(deleteDisabledReason) || Boolean(deleteLoading);

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
        <Tooltip title={deleteDisabledReason}>
          <span>
            <Popconfirm
              title="Delete warehouse?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={onDelete}
              disabled={deleteDisabled}
            >
              <Button size="small" danger icon={<DeleteOutlined />} disabled={deleteDisabled} loading={deleteLoading}>
                Delete
              </Button>
            </Popconfirm>
          </span>
        </Tooltip>
      </Space>
    </div>
  );
}
