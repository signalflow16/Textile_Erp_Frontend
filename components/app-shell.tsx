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
    if (pathname === "/buying") {
      return "buying-dashboard";
    }

    if (pathname.startsWith("/buying/material-requests")) {
      return "buying-material-requests";
    }

    if (pathname.startsWith("/buying/rfqs")) {
      return "buying-rfqs";
    }

    if (pathname.startsWith("/buying/supplier-quotations")) {
      return "buying-supplier-quotations";
    }

    if (pathname.startsWith("/buying/purchase-orders")) {
      return "buying-purchase-orders";
    }

    if (pathname.startsWith("/buying/purchase-receipts")) {
      return "buying-purchase-receipts";
    }

    if (pathname.startsWith("/buying/purchase-invoices")) {
      return "buying-purchase-invoices";
    }

    if (pathname.startsWith("/pos/opening")) {
      return "sales-pos-opening";
    }

    if (pathname.startsWith("/pos/closing")) {
      return "sales-pos-closing";
    }

    if (pathname.startsWith("/pos")) {
      return "sales-pos";
    }

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

    if (pathname.startsWith("/stock/item-groups")) {
      return "stock-item-groups";
    }

    if (pathname.startsWith("/stock/balance")) {
      return "stock-balance";
    }

    if (pathname.startsWith("/stock/ledger")) {
      return "stock-ledger";
    }

    if (pathname.startsWith("/stock/warehouse-stock")) {
      return "stock-warehouse-stock";
    }

    if (pathname.startsWith("/stock/item-shortage")) {
      return "stock-item-shortage";
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
                      key: "stock-balance",
                      label: <Link href="/stock/balance">Stock Balance</Link>
                    },
                    {
                      key: "stock-ledger",
                      label: <Link href="/stock/ledger">Stock Ledger</Link>
                    },
                    {
                      key: "stock-warehouse-stock",
                      label: <Link href="/stock/warehouse-stock">Warehouse Stock</Link>
                    },
                    {
                      key: "stock-item-shortage",
                      label: <Link href="/stock/item-shortage">Item Shortage</Link>
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
              key: "buying-header",
              type: "group",
              label: "Buying",
              children: [
                {
                  key: "buying-menu",
                  icon: <ShoppingCartOutlined />,
                  label: "Procurement",
                  children: [
                    {
                      key: "buying-dashboard",
                      label: <Link href="/buying">Dashboard</Link>
                    },
                    {
                      key: "buying-material-requests",
                      label: <Link href="/buying/material-requests">Material Requests</Link>
                    },
                    {
                      key: "buying-rfqs",
                      label: <Link href="/buying/rfqs">RFQs</Link>
                    },
                    {
                      key: "buying-supplier-quotations",
                      label: <Link href="/buying/supplier-quotations">Supplier Quotations</Link>
                    },
                    {
                      key: "buying-purchase-orders",
                      label: <Link href="/buying/purchase-orders">Purchase Orders</Link>
                    },
                    {
                      key: "buying-purchase-receipts",
                      label: <Link href="/buying/purchase-receipts">Purchase Receipts</Link>
                    },
                    {
                      key: "buying-purchase-invoices",
                      label: <Link href="/buying/purchase-invoices">Purchase Invoices</Link>
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
                  label: "Sales",
                  children: [
                    {
                      key: "sales-pos-opening",
                      label: <Link href="/pos/opening">POS Opening Entry</Link>
                    },
                    {
                      key: "sales-pos",
                      label: <Link href="/pos">POS Billing</Link>
                    },
                    {
                      key: "sales-pos-closing",
                      label: <Link href="/pos/closing">POS Closing Entry</Link>
                    }
                  ]
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
