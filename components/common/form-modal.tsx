"use client";

import { Modal } from "antd";
import type { ButtonProps, ModalProps } from "antd";

export function FormModal({
  open,
  title,
  width = 640,
  onCancel,
  onOk,
  confirmLoading,
  okText = "Save",
  okButtonProps,
  children
}: {
  open: boolean;
  title: string;
  width?: number;
  onCancel: () => void;
  onOk: () => void;
  confirmLoading?: boolean;
  okText?: string;
  okButtonProps?: ButtonProps;
  children: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      title={title}
      width={width}
      onCancel={onCancel}
      onOk={onOk}
      okText={okText}
      confirmLoading={confirmLoading}
      okButtonProps={okButtonProps as ModalProps["okButtonProps"]}
      destroyOnClose
    >
      {children}
    </Modal>
  );
}
