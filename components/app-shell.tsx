"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Layout, Menu, Space, Tag, Typography } from "antd";
import {
  AntDesignOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
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
    if (pathname.startsWith("/users")) {
      return "admin-users";
    }

    if (pathname.startsWith("/stock/item-groups")) {
      return "stock-item-groups";
    }

    if (pathname.startsWith("/stock/stock-entry/create")) {
      return "stock-entry-create";
    }

    if (pathname.startsWith("/stock/stock-entry/list")) {
      return "stock-entry-list";
    }

    if (pathname.startsWith("/stock/warehouses")) {
      return "stock-warehouses";
    }

    if (pathname.startsWith("/stock/parties")) {
      return "stock-parties";
    }

    if (pathname === "/stock") {
      return "stock-dashboard";
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
        collapsedWidth={isMobile ? 0 : 84}
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
        <div className={`brand-panel ${collapsed && !isMobile ? "brand-panel-collapsed" : ""}`}>
          <div className="brand-row">
            <div className="brand-mark">
              <AntDesignOutlined />
            </div>
            <Title level={4} className="brand-title" style={{ display: collapsed && !isMobile ? "none" : undefined }}>
              Textile ERP
            </Title>
          </div>
          {!collapsed || isMobile ? <Text className="brand-kicker">ERPNext Workspace</Text> : null}
        </div>
        {!collapsed || isMobile ? <div className="sidebar-section-title">Modules</div> : null}
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={["item-master-menu"]}
          items={[
            {
              key: "stock-header",
              type: "group",
              label: "Stock",
              children: [
                {
                  key: "item-master-menu",
                  icon: <DatabaseOutlined />,
                  label: "Stock",
                  children: [
                    {
                      key: "stock-dashboard",
                      label: <Link href="/stock">Dashboard</Link>
                    },
                    {
                      key: "stock-items-list",
                      label: <Link href="/stock/items">Items</Link>
                    },
                    {
                      key: "stock-item-groups",
                      label: <Link href="/stock/item-groups">Item Groups</Link>
                    },
                    {
                      key: "stock-warehouses",
                      label: <Link href="/stock/warehouses">Warehouses</Link>
                    },
                    {
                      key: "stock-parties",
                      label: <Link href="/stock/parties">Parties</Link>
                    },
                    {
                      key: "stock-entry-create",
                      label: <Link href="/stock/stock-entry/create">Stock Entry Create</Link>
                    },
                    {
                      key: "stock-entry-list",
                      label: <Link href="/stock/stock-entry/list">Stock Entry List</Link>
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
