"use client";

import { useMemo, useState } from "react";
import { Alert, App, Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography } from "antd";

import { extractApiErrorMessage, extractEnvelopeMessage } from "@/lib/api-errors";
import { useCreateUserAccountMutation, useGetRoleOptionsQuery, useListUsersQuery } from "@/core/api/frappeApi";
import { useAppSelector } from "@/core/store/hooks";
import type { UserAccount } from "@/core/auth/types";

const { Text } = Typography;

const MANAGER_ROLES = ["Sales Manager", "Inventory Manager", "Accounts Manager"];
const STAFF_ROLES = ["Cashier", "Accountant", "Stock User", "Sales User"];
const OWNER_EQUIVALENT_ROLES = ["Owner", "Company Owner", "System Manager", "Administrator"];

type CreateUserFormValues = {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  roles: string[];
  enabled: boolean;
};

type UserRow = UserAccount & {
  __key: string;
};

const toUserList = (payload: unknown): UserAccount[] => {
  if (Array.isArray(payload)) {
    return payload as UserAccount[];
  }

  if (payload && typeof payload === "object") {
    const data = payload as {
      users?: unknown;
      items?: unknown;
      data?: unknown;
      results?: unknown;
    };

    const candidates = [data.users, data.items, data.data, data.results];
    const firstArray = candidates.find((entry) => Array.isArray(entry));
    if (Array.isArray(firstArray)) {
      return firstArray as UserAccount[];
    }
  }

  return [];
};

export function UserManagement() {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateUserFormValues>();
  const { me } = useAppSelector((state) => state.auth);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const roles = useMemo(() => {
    const directRoles =
      Array.isArray(me?.roles) ? me.roles.filter((entry): entry is string => typeof entry === "string") : [];
    const nestedRoles =
      me && typeof me === "object" && "user" in me && me.user && typeof me.user === "object"
        ? Array.isArray((me.user as { roles?: unknown }).roles)
          ? ((me.user as { roles: unknown[] }).roles.filter(
              (entry): entry is string => typeof entry === "string"
            ) as string[])
          : []
        : [];

    return Array.from(new Set([...directRoles, ...nestedRoles]));
  }, [me]);

  const { data: roleOptionsData, isFetching: isRolesFetching } = useGetRoleOptionsQuery();
  const fallbackRoles = useMemo(
    () => Array.from(new Set([...MANAGER_ROLES, ...STAFF_ROLES])).map((role) => ({ label: role, value: role })),
    []
  );
  const rawRoleOptions = roleOptionsData?.length ? roleOptionsData : fallbackRoles;
  const isOwner = OWNER_EQUIVALENT_ROLES.some((role) => roles.includes(role));
  const isManager = MANAGER_ROLES.some((role) => roles.includes(role)) || roles.includes("Manager");
  const hasAssignableRolesFromBackend = Boolean(roleOptionsData && roleOptionsData.length > 0);
  const canManageUsers = isOwner || isManager || hasAssignableRolesFromBackend;
  const assignableRoleValues = useMemo(
    () => (isOwner ? rawRoleOptions.map((role) => role.value) : rawRoleOptions.map((role) => role.value).filter((role) => STAFF_ROLES.includes(role))),
    [isOwner, rawRoleOptions]
  );
  const assignableRoles = useMemo(
    () => rawRoleOptions.filter((role) => assignableRoleValues.includes(role.value)),
    [assignableRoleValues, rawRoleOptions]
  );

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const { data, isFetching, refetch, error } = useListUsersQuery({
    page: 1,
    pageSize: 100,
    search: query
  });
  const [createUserAccount, createState] = useCreateUserAccountMutation();
  const companyName =
    (typeof me?.company === "string" && me.company) ||
    (typeof me?.company_name === "string" && me.company_name) ||
    (me && typeof me === "object" && "user" in me && me.user && typeof me.user === "object"
      ? (me.user as { company?: unknown; company_name?: unknown }).company_name ||
        (me.user as { company?: unknown }).company
      : null);

  const users = useMemo(() => {
    if (!data?.ok) {
      return [];
    }

    return toUserList(data.data);
  }, [data]);

  const userRows = useMemo<UserRow[]>(
    () =>
      users.map((user, index) => ({
        ...user,
        __key: user.user_id || user.email || `user-${index}`
      })),
    [users]
  );

  const handleCreateUser = async (values: CreateUserFormValues) => {
    try {
      const response = await createUserAccount({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        roles: values.roles,
        enabled: values.enabled
      }).unwrap();

      if (!response.ok) {
        message.error(extractEnvelopeMessage(response, "Unable to create user."));
        return;
      }

      message.success("User account created.");
      setIsCreateModalOpen(false);
      form.resetFields();
      await refetch();
    } catch (requestError) {
      message.error(extractApiErrorMessage(requestError, "Unable to create user account."));
    }
  };

  if (!canManageUsers) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Insufficient permissions"
        description="Only Owner and Manager roles can create users from this page."
      />
    );
  }

  return (
    <div className="page-stack">
      <Card
        title="User Creation"
        extra={<Tag color={isOwner ? "purple" : "blue"}>{isOwner ? "Owner access" : "Manager access"}</Tag>}
      >
        <Space direction="vertical" size={8}>
          <Text type="secondary">
            {isOwner
              ? "You can create manager and staff users."
              : "You can create staff users based on ERPNext role master data."}
          </Text>
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Create User
          </Button>
        </Space>
      </Card>

      <Card
        title={companyName ? `Users - ${String(companyName)}` : "Users in Company"}
        extra={
          <Space>
            <Input.Search
              placeholder="Search users"
              allowClear
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onSearch={(value) => setQuery(value.trim())}
              style={{ width: 240 }}
            />
            <Button onClick={() => refetch()} loading={isFetching}>
              Refresh
            </Button>
          </Space>
        }
      >
        {!data?.ok && data ? (
          <Alert
            type="error"
            showIcon
            message="Unable to load users"
            description={extractEnvelopeMessage(data, "The user list endpoint returned an error.")}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {error ? (
          <Alert
            type="error"
            showIcon
            message="Unable to load users"
            description={extractApiErrorMessage(error, "Request failed while loading users.")}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Table<UserRow>
          rowKey={(record) => record.__key}
          loading={isFetching}
          dataSource={userRows}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "User",
              key: "user",
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.full_name || `${record.first_name || ""} ${record.last_name || ""}`.trim() || "N/A"}</Text>
                  <Text type="secondary">{record.email || record.user_id || "-"}</Text>
                </Space>
              )
            },
            {
              title: "Roles",
              key: "roles",
              render: (_, record) => (
                <Space size={[4, 4]} wrap>
                  {(record.roles || []).map((role) => (
                    <Tag key={role}>{role}</Tag>
                  ))}
                </Space>
              )
            },
            {
              title: "Status",
              key: "status",
              render: (_, record) =>
                record.enabled === false ? <Tag color="red">Disabled</Tag> : <Tag color="green">Enabled</Tag>
            }
          ]}
        />
      </Card>

      <Modal
        title={isOwner ? "Create Manager or Staff User" : "Create Staff User"}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateUserFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ enabled: true, roles: [] }}
          onFinish={handleCreateUser}
        >
          <div className="user-form-grid">
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email is required." },
                { type: "email", message: "Enter a valid email." }
              ]}
            >
              <Input placeholder="manager@company.com" />
            </Form.Item>

            <Form.Item label="Password" name="password" rules={[{ required: true, message: "Password is required." }]}>
              <Input.Password placeholder="StrongPass@123" />
            </Form.Item>

            <Form.Item
              label="First Name"
              name="first_name"
              rules={[{ required: true, message: "First name is required." }]}
            >
              <Input placeholder="Manager" />
            </Form.Item>

            <Form.Item label="Last Name" name="last_name">
              <Input placeholder="User" />
            </Form.Item>

            <Form.Item
              label="Roles"
              name="roles"
              rules={[{ required: true, message: "Choose at least one role." }]}
            >
              <Select
                mode="multiple"
                options={assignableRoles}
                loading={isRolesFetching}
                placeholder="Select role(s) from ERPNext roles"
              />
            </Form.Item>

            <Form.Item label="Enabled" name="enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <Space>
            <Button type="primary" htmlType="submit" loading={createState.isLoading}>
              Create User
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                setIsCreateModalOpen(false);
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

