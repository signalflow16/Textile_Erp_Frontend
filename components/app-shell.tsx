"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Layout, Menu, Space, Tag, Typography } from "antd";
import {
  AppstoreOutlined,
  DatabaseOutlined,
  FileAddOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { clearAuthTokens } from "@/lib/auth-storage";
import { frappeApi, useLogoutUserMutation } from "@/store/api/frappeApi";
import { clearAuth } from "@/store/features/auth/authSlice";
import { setCsrfToken } from "@/store/features/session/sessionSlice";
import { useAppDispatch } from "@/store/hooks";

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

export function AppShell({
  section = "Stock",
  title,
  breadcrumb,
  subtitle,
  actions,
  children
}: {
  section?: string;
  title: string;
  breadcrumb?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [logoutUser, logoutState] = useLogoutUserMutation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const selectedKey = (() => {
    if (pathname === "/initial-setup") {
      return "admin-initial-setup-dashboard";
    }

    if (pathname.startsWith("/initial-setup/company")) {
      return "admin-initial-setup-company";
    }

    if (pathname.startsWith("/initial-setup/warehouses")) {
      return "admin-initial-setup-warehouses";
    }

    if (pathname.startsWith("/initial-setup/uoms")) {
      return "admin-initial-setup-uoms";
    }

    if (pathname.startsWith("/initial-setup/item-groups")) {
      return "admin-initial-setup-item-groups";
    }

    if (pathname.startsWith("/initial-setup/suppliers")) {
      return "admin-initial-setup-suppliers";
    }

    if (pathname.startsWith("/initial-setup/customers")) {
      return "admin-initial-setup-customers";
    }

    if (pathname.startsWith("/initial-setup")) {
      return "admin-initial-setup-dashboard";
    }

    if (pathname.startsWith("/users")) {
      return "admin-users";
    }

    if (pathname === "/stock/items/new") {
      return "stock-items-new";
    }

    return "stock-items-list";
  })();

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch {
      // Continue with local sign-out even when remote logout fails.
    } finally {
      clearAuthTokens();
      dispatch(clearAuth());
      dispatch(setCsrfToken(null));
      dispatch(frappeApi.util.resetApiState());
      router.replace("/signin");
    }
  };

  return (
    <Layout className="app-layout">
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        collapsible
        trigger={null}
        width={260}
        className="app-sider"
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        onBreakpoint={(broken) => {
          setIsMobile(broken);
          setCollapsed(broken);
        }}
      >
        <div className="brand-panel">
          <Text className="brand-kicker">ERPNext Commerce</Text>
          <Title level={4} className="brand-title">
            Textile ERP
          </Title>
          {/* <Text className="brand-copy">
            React, Next.js, Ant Design, and ERPNext working together for operational workflows.
          </Text> */}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={["item-master-menu", "initial-setup-menu"]}
          items={[
            {
              key: "stock-header",
              type: "group",
              label: "Stock",
              children: [
                {
                  key: "item-master-menu",
                  icon: <DatabaseOutlined />,
                  label: "Item Master",
                  children: [
                    {
                      key: "stock-items-list",
                      label: <Link href="/stock/items">Item List</Link>
                    },
                    {
                      key: "stock-items-new",
                      icon: <FileAddOutlined />,
                      label: <Link href="/stock/items/new">Create Item</Link>
                    }
                  ]
                }
              ]
            },
            {
              key: "admin-header",
              type: "group",
              label: "Administration",
              children: [
                {
                  key: "initial-setup-menu",
                  icon: <DatabaseOutlined />,
                  label: "Initial Setup",
                  children: [
                    {
                      key: "admin-initial-setup-dashboard",
                      label: <Link href="/initial-setup">Dashboard</Link>
                    },
                    {
                      key: "admin-initial-setup-company",
                      label: <Link href="/initial-setup/company">Company</Link>
                    },
                    {
                      key: "admin-initial-setup-warehouses",
                      label: <Link href="/initial-setup/warehouses">Warehouses</Link>
                    },
                    {
                      key: "admin-initial-setup-uoms",
                      label: <Link href="/initial-setup/uoms">UOMs</Link>
                    },
                    {
                      key: "admin-initial-setup-item-groups",
                      label: <Link href="/initial-setup/item-groups">Item Groups</Link>
                    },
                    {
                      key: "admin-initial-setup-suppliers",
                      label: <Link href="/initial-setup/suppliers">Suppliers</Link>
                    },
                    {
                      key: "admin-initial-setup-customers",
                      label: <Link href="/initial-setup/customers">Customers</Link>
                    }
                  ]
                },
                {
                  key: "admin-users",
                  icon: <TeamOutlined />,
                  label: <Link href="/users">Users</Link>
                }
              ]
            },
            {
              key: "future-header",
              type: "group",
              label: "Planned Modules",
              children: [
                {
                  key: "warehouse",
                  icon: <ShopOutlined />,
                  label: "Warehouse"
                },
                {
                  key: "purchase",
                  icon: <ShoppingCartOutlined />,
                  label: "Purchase"
                },
                {
                  key: "sales",
                  icon: <AppstoreOutlined />,
                  label: "Sales"
                }
              ]
            }
          ]}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="app-header-main">
            <div>
              <Space size="small" align="center">
                <Button
                  type="text"
                  size="large"
                  className="sidebar-toggle-btn"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed((prev) => !prev)}
                />
                <Tag color="blue">{section}</Tag>
                <Text className="header-title">{title}</Text>
              </Space>
              {breadcrumb ? <div className="header-breadcrumb">{breadcrumb}</div> : null}
              {subtitle ? <div className="header-subtitle">{subtitle}</div> : null}
            </div>
            <div className="app-header-actions">
              {actions}
              <Button
                danger
                onClick={handleLogout}
                icon={<LogoutOutlined />}
                loading={logoutState.isLoading}
              >
                Logout
              </Button>
            </div>
          </div>
        </Header>
        {isMobile && !collapsed ? (
          <div className="sidebar-backdrop" onClick={() => setCollapsed(true)} aria-hidden />
        ) : null}
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
