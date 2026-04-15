"use client";

import { useEffect } from "react";
import { RoleManagement } from "@/components/users/role-management";
import { UserManagement } from "@/components/users/user-management";
import { useAppShell } from "@/core/context/app-shell-context";
import { Tabs } from "antd";

export default function UsersPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Users",
      subtitle: "Owners can create manager accounts. Managers can create staff users like Cashier and Accountant."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return (
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
  );
}
