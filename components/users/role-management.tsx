"use client";

import { useMemo, useState } from "react";
import { Alert, App, Button, Card, Form, Input, Modal, Space, Table, Tag, Typography } from "antd";

import { extractApiErrorMessage, extractEnvelopeMessage } from "@/lib/api-errors";
import { useCreateRoleMutation, useGetRolesMasterQuery } from "@/core/api/frappeApi";
import type { RoleMasterItem } from "@/core/auth/types";

const { Text } = Typography;

type CreateRoleValues = {
  role_name: string;
};

export function RoleManagement() {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateRoleValues>();
  const [open, setOpen] = useState(false);

  const { data, error, isFetching, refetch } = useGetRolesMasterQuery();
  const [createRole, createRoleState] = useCreateRoleMutation();

  const roles = useMemo(() => {
    if (!data?.ok) {
      return [];
    }
    return data.data.roles || [];
  }, [data]);

  const handleCreateRole = async (values: CreateRoleValues) => {
    try {
      const response = await createRole({ role_name: values.role_name.trim() }).unwrap();
      if (!response.ok) {
        message.error(extractEnvelopeMessage(response, "Unable to create role."));
        return;
      }

      message.success(extractEnvelopeMessage(response, "Role created."));
      setOpen(false);
      form.resetFields();
      await refetch();
    } catch (requestError) {
      message.error(extractApiErrorMessage(requestError, "Unable to create role."));
    }
  };

  return (
    <div className="page-stack">
      <Card
        title="Role Management"
        extra={
          <Space>
            <Button onClick={() => refetch()} loading={isFetching}>
              Refresh
            </Button>
            <Button type="primary" onClick={() => setOpen(true)}>
              Create Role
            </Button>
          </Space>
        }
      >
        <Text type="secondary">
          Create custom roles and manage assignable role master data for user provisioning.
        </Text>

        {!data?.ok && data ? (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message="Unable to load role master"
            description={extractEnvelopeMessage(data, "Role master endpoint returned an error.")}
          />
        ) : null}

        {error ? (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message="Unable to load role master"
            description={extractApiErrorMessage(error, "Request failed while loading roles.")}
          />
        ) : null}
      </Card>

      <Card title="Roles Master">
        <Table<RoleMasterItem>
          rowKey={(record) => record.value}
          loading={isFetching}
          dataSource={roles}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Role",
              key: "role",
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.label}</Text>
                  <Text type="secondary">{record.value}</Text>
                </Space>
              )
            },
            {
              title: "Type",
              key: "type",
              render: (_, record) => (
                <Tag color={record.is_custom ? "geekblue" : "default"}>
                  {record.is_custom ? "Custom" : "Default"}
                </Tag>
              )
            },
            {
              title: "Assignable",
              key: "assignable",
              render: (_, record) => (
                <Tag color={record.assignable === false ? "red" : "green"}>
                  {record.assignable === false ? "No" : "Yes"}
                </Tag>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title="Create Custom Role"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateRoleValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleCreateRole}
        >
          <Form.Item
            label="Role Name"
            name="role_name"
            rules={[
              { required: true, message: "Role name is required." },
              { min: 3, message: "Use at least 3 characters." }
            ]}
          >
            <Input placeholder="Production Supervisor" />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={createRoleState.isLoading}>
              Create Role
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
