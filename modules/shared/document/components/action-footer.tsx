"use client";

import { Button, Space } from "antd";

export function ActionFooter({
  onSave,
  onSubmit,
  onCancel,
  disableSubmit,
  loading,
  readonly,
  canCancel
}: {
  onSave: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  disableSubmit?: boolean;
  loading?: boolean;
  readonly?: boolean;
  canCancel?: boolean;
}) {
  return (
    <div className="document-action-footer">
      <Space>
        {!readonly ? <Button onClick={onSave} loading={loading}>Save Draft</Button> : null}
        {!readonly ? <Button type="primary" onClick={onSubmit} disabled={disableSubmit} loading={loading}>Submit</Button> : null}
        {canCancel ? <Button danger onClick={onCancel}>Cancel Document</Button> : null}
      </Space>
    </div>
  );
}
