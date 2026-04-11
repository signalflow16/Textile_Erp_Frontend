"use client";

import { Tabs } from "antd";

import { AppShell } from "@/components/app-shell";
import { RoleManagement } from "@/components/users/role-management";
import { UserManagement } from "@/components/users/user-management";

export default function UsersPage() {
  return (
    <AppShell
      section="Administration"
      title="Users"
      breadcrumb="Administration > Users"
      subtitle="Owners can create manager accounts. Managers can create staff users like Cashier and Accountant."
    >
      <Tabs
        defaultActiveKey="users"
        items={[
          {
            key: "users",
            label: "Users",
            children: <UserManagement />
          },
          {
            key: "roles",
            label: "Role Management",
            children: <RoleManagement />
          }
        ]}
      />
    </AppShell>
  );
}
